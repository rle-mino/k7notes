import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Pencil, Play, Mic } from "lucide-react-native";
import type { AudioRecording } from "@/hooks/useAudioRecordings";

interface AudioCardProps {
  recording: AudioRecording;
}

export function AudioCard({ recording }: AudioCardProps) {
  const formattedDate = recording.createdAt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = recording.createdAt.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedDuration = recording.durationSeconds
    ? formatDuration(recording.durationSeconds)
    : null;

  const transcriptionPreview = recording.transcription
    ? recording.transcription.text.slice(0, 100) +
      (recording.transcription.text.length > 100 ? "..." : "")
    : null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {recording.title}
          </Text>
          <TouchableOpacity style={styles.editButton} activeOpacity={0.7}>
            <Pencil size={14} color="#999" />
          </TouchableOpacity>
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
            <Text style={styles.notTranscribedText}>Not transcribed</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.playButton} activeOpacity={0.7}>
          <Play size={16} color="#007AFF" />
          <Text style={styles.playButtonText}>Play</Text>
        </TouchableOpacity>

        {!recording.transcription ? (
          <TouchableOpacity
            style={styles.transcribeButton}
            activeOpacity={0.7}
          >
            <Mic size={16} color="#fff" />
            <Text style={styles.transcribeButtonText}>Transcribe</Text>
          </TouchableOpacity>
        ) : null}
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
  transcribeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#007AFF",
  },
  transcribeButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#fff",
  },
});
