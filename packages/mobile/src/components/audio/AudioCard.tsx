import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Platform,
  TextInput,
} from "react-native";
import { Pencil, Play, Pause, Mic } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import type { AudioRecording } from "@/hooks/useAudioRecordings";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { usePreferences } from "@/hooks/usePreferences";
import { getRecordingBase64 } from "@/lib/audioStorage";
import { storage } from "@/lib/storage";
import { orpc } from "@/lib/orpc";
import { colors, spacing, radius } from "@/theme";

const LOCAL_TITLES_KEY = "audio_local_titles";

interface AudioCardProps {
  recording: AudioRecording;
}

function getMimeType(fileName: string): string {
  if (fileName.endsWith(".webm")) return "audio/webm";
  if (fileName.endsWith(".wav")) return "audio/wav";
  if (fileName.endsWith(".ogg")) return "audio/ogg";
  return "audio/m4a";
}

export function AudioCard({ recording }: AudioCardProps) {
  const { t, i18n } = useTranslation();
  const { resolvedTranscriptionLanguage } = usePreferences();
  const { play, pause, isPlaying, progress, duration, currentUri } =
    useAudioPlayer();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [localTranscription, setLocalTranscription] = useState<
    AudioRecording["transcription"] | undefined
  >(undefined);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [localTitle, setLocalTitle] = useState<string | undefined>();
  const [selectedLang, setSelectedLang] = useState<string | null>(null);

  const isThisPlaying = isPlaying && currentUri === recording.fileUri;
  const transcription = localTranscription ?? recording.transcription;
  const displayTitle = localTitle ?? recording.title;

  const playbackProgress =
    isThisPlaying && duration > 0 ? progress / duration : 0;
  const fillPercent = Math.min(Math.round(playbackProgress * 100), 100);

  const formattedDate = recording.createdAt.toLocaleDateString(i18n.language, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = recording.createdAt.toLocaleTimeString(i18n.language, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedDuration = recording.durationSeconds
    ? formatDuration(recording.durationSeconds)
    : null;

  const transcriptionPreview = transcription
    ? transcription.text.slice(0, 100) +
      (transcription.text.length > 100 ? "..." : "")
    : null;

  const handleEditStart = () => {
    setEditedTitle(displayTitle);
    setIsEditing(true);
  };

  const handleTitleSave = async () => {
    setIsEditing(false);
    const trimmed = editedTitle.trim();
    if (!trimmed || trimmed === displayTitle) return;

    setLocalTitle(trimmed);

    if (transcription) {
      // Recording has a transcription: update on server
      try {
        await orpc.transcriptions.updateTitle({
          id: transcription.id,
          title: trimmed,
        });
      } catch (err) {
        console.error("Failed to update title:", err);
        setLocalTitle(undefined); // revert on failure
      }
    } else {
      // Un-transcribed: persist locally via storage
      try {
        const raw = await storage.getItem(LOCAL_TITLES_KEY);
        const titles: Record<string, string> = raw ? JSON.parse(raw) : {};
        titles[recording.fileName] = trimmed;
        await storage.setItem(LOCAL_TITLES_KEY, JSON.stringify(titles));
      } catch (err) {
        console.error("Failed to save local title:", err);
      }
    }
  };

  const handlePlayPause = async () => {
    if (isThisPlaying) {
      pause();
    } else {
      await play(recording.fileUri);
    }
  };

  const handleTranscribe = async () => {
    setIsTranscribing(true);
    setTranscribeError(null);

    try {
      // Use fileName on web (blob URIs are ephemeral), fileUri on native
      const fileArg =
        Platform.OS === "web" ? recording.fileName : recording.fileUri;
      const base64 = await getRecordingBase64(fileArg);
      const mimeType = getMimeType(recording.fileName);

      const currentTitle = localTitle ?? recording.title;

      const result = await orpc.transcriptions.transcribe({
        audioBase64: base64,
        mimeType,
        diarization: true,
        title: currentTitle,
        localFileName: recording.fileName,
        language: selectedLang || resolvedTranscriptionLanguage || undefined,
      });

      setLocalTranscription({
        id: result.id,
        text: result.text,
        language: result.language ?? null,
      });

      // Clear local title override -- it is now stored server-side
      try {
        const raw = await storage.getItem(LOCAL_TITLES_KEY);
        if (raw) {
          const titles: Record<string, string> = JSON.parse(raw);
          delete titles[recording.fileName];
          await storage.setItem(LOCAL_TITLES_KEY, JSON.stringify(titles));
        }
      } catch {
        // ignore cleanup errors
      }
    } catch (err) {
      console.error("Transcription failed:", err);
      setTranscribeError(
        err instanceof Error ? err.message : "Transcription failed",
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleRetranscribe = async () => {
    setIsTranscribing(true);
    setTranscribeError(null);

    try {
      const fileArg =
        Platform.OS === "web" ? recording.fileName : recording.fileUri;
      const base64 = await getRecordingBase64(fileArg);
      const mimeType = getMimeType(recording.fileName);
      const currentTitle = localTitle ?? recording.title;

      const result = await orpc.transcriptions.transcribe({
        audioBase64: base64,
        mimeType,
        diarization: true,
        title: currentTitle,
        localFileName: recording.fileName,
        language: selectedLang || resolvedTranscriptionLanguage || undefined,
      });

      setLocalTranscription({
        id: result.id,
        text: result.text,
        language: result.language ?? null,
      });
    } catch (err) {
      console.error("Re-transcription failed:", err);
      setTranscribeError(
        err instanceof Error ? err.message : "Transcription failed",
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {isEditing ? (
            <TextInput
              style={styles.titleInput}
              value={editedTitle}
              onChangeText={setEditedTitle}
              onBlur={handleTitleSave}
              onSubmitEditing={handleTitleSave}
              autoFocus
              selectTextOnFocus
              returnKeyType="done"
              maxLength={500}
            />
          ) : (
            <>
              <Text style={styles.title} numberOfLines={1}>
                {displayTitle}
              </Text>
              <TouchableOpacity
                style={styles.editButton}
                activeOpacity={0.7}
                onPress={handleEditStart}
              >
                <Pencil size={14} color="#999" />
              </TouchableOpacity>
            </>
          )}
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {formattedDate} {formattedTime}
          </Text>
          {formattedDuration ? (
            <Text style={styles.metaText}> &middot; {formattedDuration}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.body}>
        {transcriptionPreview ? (
          <Text style={styles.preview} numberOfLines={3}>
            {transcriptionPreview}
          </Text>
        ) : (
          <View style={styles.notTranscribedBadge}>
            <Text style={styles.notTranscribedText}>{t("audio.notTranscribed")}</Text>
          </View>
        )}
      </View>

      {transcribeError ? (
        <Text style={styles.errorText}>{transcribeError}</Text>
      ) : null}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.playButton}
          activeOpacity={0.7}
          onPress={handlePlayPause}
        >
          {isThisPlaying ? (
            <Pause size={16} color="#007AFF" />
          ) : (
            <Play size={16} color="#007AFF" />
          )}
          <Text style={styles.playButtonText}>
            {isThisPlaying ? t("audio.pause") : t("audio.play")}
          </Text>
        </TouchableOpacity>

        {isThisPlaying && duration > 0 ? (
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { flex: fillPercent || 0.01 }]}
              />
              <View style={{ flex: Math.max(100 - fillPercent, 0.01) }} />
            </View>
            <Text style={styles.progressText}>
              {formatTime(progress)} / {formatTime(duration)}
            </Text>
          </View>
        ) : null}

        {!transcription ? (
          <TouchableOpacity
            style={[
              styles.transcribeButton,
              isTranscribing && styles.transcribeButtonDisabled,
            ]}
            activeOpacity={0.7}
            onPress={handleTranscribe}
            disabled={isTranscribing}
          >
            {isTranscribing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Mic size={16} color="#fff" />
            )}
            <Text style={styles.transcribeButtonText}>
              {isTranscribing ? t("audio.transcribingBtn") : t("audio.transcribe")}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.retranscribeButton,
              isTranscribing && styles.transcribeButtonDisabled,
            ]}
            activeOpacity={0.7}
            onPress={handleRetranscribe}
            disabled={isTranscribing}
          >
            {isTranscribing ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Mic size={16} color={colors.accent} />
            )}
            <Text style={styles.retranscribeButtonText}>
              {isTranscribing ? t("audio.transcribingBtn") : t("audio.retranscribe")}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.langChip}
          onPress={() => setSelectedLang(
            (selectedLang || resolvedTranscriptionLanguage) === "fr" ? "en" : "fr"
          )}
        >
          <Text style={styles.langChipText}>
            {(selectedLang || resolvedTranscriptionLanguage).toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins === 0) {
    return `${secs}s`;
  }
  return `${mins}m ${secs}s`;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 12,
    marginVertical: 4,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
    flex: 1,
  },
  titleInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
    borderBottomWidth: 1,
    borderBottomColor: "#007AFF",
    paddingVertical: 2,
    paddingHorizontal: 0,
  },
  editButton: {
    padding: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 12,
    color: "#999",
  },
  body: {
    marginBottom: 10,
  },
  preview: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  notTranscribedBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  notTranscribedText: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
  },
  errorText: {
    fontSize: 12,
    color: "#FF3B30",
    marginBottom: 8,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  playButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#f0f7ff",
    borderWidth: 1,
    borderColor: "#d0e4ff",
  },
  playButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#007AFF",
  },
  progressContainer: {
    flex: 1,
    gap: 2,
  },
  progressTrack: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#e5e5e5",
    flexDirection: "row",
    overflow: "hidden",
  },
  progressFill: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#007AFF",
  },
  progressText: {
    fontSize: 11,
    color: "#999",
    fontVariant: ["tabular-nums"],
  },
  transcribeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#007AFF",
  },
  transcribeButtonDisabled: {
    opacity: 0.7,
  },
  transcribeButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#fff",
  },
  retranscribeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    backgroundColor: colors.accentLight,
    borderWidth: 1,
    borderColor: colors.accentMuted,
  },
  retranscribeButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.accent,
  },
  langChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  langChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
});
