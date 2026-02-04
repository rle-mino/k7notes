import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Modal,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from "expo-audio";
import { readAsStringAsync, EncodingType } from "expo-file-system";
import { router } from "expo-router";
import { Mic, Square, X } from "lucide-react-native";
import { ORPCError } from "@orpc/client";
import { orpc } from "@/lib/orpc";

type RecordingState = "idle" | "recording" | "stopped" | "transcribing" | "creating";

function getErrorMessage(err: unknown): string {
  if (err instanceof ORPCError) {
    return err.message || `Error: ${err.code}`;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "An error occurred";
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

interface AudioRecordingModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AudioRecordingModal({ visible, onClose }: AudioRecordingModalProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderRef = useRef(recorder);
  recorderRef.current = recorder;

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      abortControllerRef.current?.abort();
    };
  }, []);

  // Start recording when modal opens
  useEffect(() => {
    if (visible) {
      startRecording();
    } else {
      // Reset state when modal closes
      setRecordingState("idle");
      setDuration(0);
      setError(null);
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }
  }, [visible]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setDuration(0);

      // Request permissions
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        setError("Microphone permission is required to record audio");
        return;
      }

      // Configure audio mode for recording
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      // Prepare and start recording
      await recorderRef.current.prepareToRecordAsync();
      recorderRef.current.record();
      setRecordingState("recording");

      // Start duration timer
      const startTime = Date.now();
      durationIntervalRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } catch (err) {
      console.error("Failed to start recording:", err);
      setError(getErrorMessage(err));
      setRecordingState("idle");
    }
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      // Stop duration timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      setRecordingState("stopped");

      // Stop recording
      await recorderRef.current.stop();

      // Reset audio mode
      await setAudioModeAsync({
        allowsRecording: false,
      });

      // Get the recording URI
      const uri = recorderRef.current.uri;
      if (!uri) {
        throw new Error("No recording URI available");
      }

      // Process the recording
      await processRecording(uri);
    } catch (err) {
      console.error("Failed to stop recording:", err);
      setError(getErrorMessage(err));
      setRecordingState("idle");
    }
  }, []);

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const base64Data = dataUrl.split(",")[1];
        if (base64Data) {
          resolve(base64Data);
        } else {
          reject(new Error("Failed to extract base64 data"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const processRecording = async (uri: string) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setRecordingState("transcribing");

      let base64: string;
      let mimeType: string;

      if (Platform.OS === "web") {
        // Web: fetch the blob URI created by expo-audio's MediaRecorder wrapper
        const response = await fetch(uri);
        const blob = await response.blob();
        // Browser knows the actual MIME type from MediaRecorder (typically audio/webm)
        mimeType = blob.type || "audio/webm";
        base64 = await blobToBase64(blob);
      } else {
        // Native (iOS/Android): expo-file-system/legacy for reliable binary file reading
        base64 = await readAsStringAsync(uri, {
          encoding: EncodingType.Base64,
        });
        // expo-audio HIGH_QUALITY preset outputs .m4a (AAC in MPEG-4) on both platforms
        mimeType = "audio/m4a";
      }

      // Call transcription API
      const result = await orpc.transcriptions.transcribe({
        audioBase64: base64,
        mimeType,
        diarization: true,
      }, { signal: controller.signal });

      // Create a note with the transcription
      setRecordingState("creating");

      // Format content with speaker labels if available
      let content: string;
      if (result.segments && result.segments.length > 0) {
        content = result.segments
          .map((seg) => `**${seg.speaker}:** ${seg.text}`)
          .join("\n\n");
      } else {
        content = result.text;
      }

      // Generate title from first few words or use timestamp
      const firstWords = result.text.split(" ").slice(0, 5).join(" ");
      const title = firstWords.length > 0
        ? `${firstWords}${result.text.split(" ").length > 5 ? "..." : ""}`
        : `Audio Note ${new Date().toLocaleString()}`;

      const newNote = await orpc.notes.create({
        title,
        content,
        folderId: null,
      }, { signal: controller.signal });

      // Link transcription to the newly created note
      await orpc.transcriptions.linkToNote({
        transcriptionId: result.id,
        noteId: newNote.id,
      }, { signal: controller.signal });

      // Close modal and navigate to the note
      onClose();
      router.push(`/notes/${newNote.id}`);
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error("Failed to process recording:", err);
      setError(getErrorMessage(err));
      setRecordingState("idle");
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleCancel = useCallback(async () => {
    // Abort any in-flight API calls
    abortControllerRef.current?.abort();

    // Stop recording if active
    if (recordingState === "recording") {
      try {
        await recorderRef.current.stop();
        await setAudioModeAsync({
          allowsRecording: false,
        });
      } catch (err) {
        console.error("Error stopping recording on cancel:", err);
      }
    }

    // Clear timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    onClose();
  }, [recordingState, onClose]);

  const getStatusText = () => {
    switch (recordingState) {
      case "recording":
        return "Recording...";
      case "stopped":
        return "Processing...";
      case "transcribing":
        return "Transcribing...";
      case "creating":
        return "Creating note...";
      default:
        return "Preparing...";
    }
  };

  const isProcessing = ["stopped", "transcribing", "creating"].includes(recordingState);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Close button — always enabled so user can cancel during processing */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleCancel}
          >
            <X size={24} color="#666" />
          </TouchableOpacity>

          {/* Recording indicator */}
          <View style={styles.recordingIndicator}>
            {recordingState === "recording" ? (
              <View style={styles.micContainer}>
                <View style={styles.pulseOuter} />
                <View style={styles.micCircle}>
                  <Mic size={40} color="#fff" />
                </View>
              </View>
            ) : isProcessing ? (
              <ActivityIndicator size="large" color="#007AFF" />
            ) : (
              <View style={styles.micCircle}>
                <Mic size={40} color="#fff" />
              </View>
            )}
          </View>

          {/* Status text */}
          <Text style={styles.statusText}>{getStatusText()}</Text>

          {/* Duration */}
          {recordingState === "recording" && (
            <Text style={styles.duration}>{formatDuration(duration)}</Text>
          )}

          {/* Error message */}
          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Stop button */}
          {recordingState === "recording" && (
            <TouchableOpacity
              style={styles.stopButton}
              onPress={stopRecording}
              activeOpacity={0.8}
            >
              <Square size={24} color="#fff" fill="#fff" />
              <Text style={styles.stopButtonText}>Stop Recording</Text>
            </TouchableOpacity>
          )}

          {/* Cancel button during processing */}
          {isProcessing && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}

          {/* Retry button on error */}
          {error && recordingState === "idle" && (
            <View style={styles.errorButtons}>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={startRecording}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 32,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 8,
  },
  recordingIndicator: {
    marginTop: 16,
    marginBottom: 24,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  micContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  pulseOuter: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 59, 48, 0.2)",
  },
  micCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  duration: {
    fontSize: 48,
    fontWeight: "300",
    color: "#1a1a1a",
    fontVariant: ["tabular-nums"],
    marginBottom: 24,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  stopButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF3B30",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    gap: 12,
    marginTop: 8,
  },
  stopButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  errorButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
});
