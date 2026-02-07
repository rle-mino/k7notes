import React, { useState, useCallback, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Play, Pause, Mic } from "lucide-react-native";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import {
  useAudioRecordings,
  type AudioRecording,
} from "@/hooks/useAudioRecordings";
import { usePreferences } from "@/hooks/usePreferences";
import { getRecordingBase64 } from "@/lib/audioStorage";
import { storage } from "@/lib/storage";
import { orpc } from "@/lib/orpc";
import { colors, typography, spacing, radius } from "@/theme";

const LOCAL_TITLES_KEY = "audio_local_titles";

function getMimeType(fileName: string): string {
  if (fileName.endsWith(".webm")) return "audio/webm";
  if (fileName.endsWith(".wav")) return "audio/wav";
  if (fileName.endsWith(".ogg")) return "audio/ogg";
  return "audio/m4a";
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export default function AudioDetailScreen() {
  const { t, i18n } = useTranslation();
  const { fileName } = useLocalSearchParams<{ fileName: string }>();
  const insets = useSafeAreaInsets();
  const { resolvedTranscriptionLanguage } = usePreferences();
  const { play, pause, isPlaying, progress, duration, currentUri } =
    useAudioPlayer();
  const { recordings } = useAudioRecordings();

  const recording = useMemo(
    () => recordings.find((r) => r.fileName === fileName),
    [recordings, fileName],
  );

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [localTranscription, setLocalTranscription] = useState<
    AudioRecording["transcription"] | undefined
  >(undefined);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [localTitle, setLocalTitle] = useState<string | undefined>();
  const [selectedLang, setSelectedLang] = useState<string | null>(null);

  const transcription = localTranscription ?? recording?.transcription;
  const displayTitle = localTitle ?? recording?.title ?? fileName ?? "";

  const isThisPlaying = isPlaying && currentUri === recording?.fileUri;
  const playbackProgress =
    isThisPlaying && duration > 0 ? progress / duration : 0;
  const fillPercent = Math.min(Math.round(playbackProgress * 100), 100);

  const formattedDate = recording
    ? recording.createdAt.toLocaleDateString(i18n.language, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const formattedDuration = recording?.durationSeconds
    ? formatDuration(recording.durationSeconds)
    : null;

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleEditStart = () => {
    setEditedTitle(displayTitle);
    setIsEditingTitle(true);
  };

  const handleTitleSave = async () => {
    setIsEditingTitle(false);
    const trimmed = editedTitle.trim();
    if (!trimmed || trimmed === displayTitle || !recording) return;

    setLocalTitle(trimmed);

    if (transcription) {
      try {
        await orpc.transcriptions.updateTitle({
          id: transcription.id,
          title: trimmed,
        });
      } catch (err) {
        console.error("Failed to update title:", err);
        setLocalTitle(undefined);
      }
    } else {
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
    if (!recording) return;
    if (isThisPlaying) {
      pause();
    } else {
      await play(recording.fileUri);
    }
  };

  const handleTranscribe = async () => {
    if (!recording) return;
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

      // Clear local title override -- now stored server-side
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

  if (!recording) {
    return (
      <>
        <Stack.Screen options={{ title: t("notes.loading") }} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>{t("notes.loadingNote")}</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ChevronLeft size={20} color={colors.accent} strokeWidth={2} />
              <Text style={styles.backText}>{t("notes.back")}</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={[styles.container, { paddingBottom: insets.bottom }]}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Title */}
        <View style={styles.titleContainer}>
          {isEditingTitle ? (
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
            <TouchableOpacity onPress={handleEditStart} activeOpacity={0.7}>
              <Text style={styles.titleText}>{displayTitle}</Text>
            </TouchableOpacity>
          )}
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{formattedDate}</Text>
            {formattedDuration ? (
              <Text style={styles.metaText}> &middot; {formattedDuration}</Text>
            ) : null}
          </View>
          <View style={styles.titleDivider} />
        </View>

        {/* Audio Player */}
        <View style={styles.playerSection}>
          <TouchableOpacity
            style={styles.playButton}
            activeOpacity={0.7}
            onPress={handlePlayPause}
          >
            {isThisPlaying ? (
              <Pause size={20} color={colors.accent} />
            ) : (
              <Play size={20} color={colors.accent} />
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
        </View>

        {/* Re-transcribe bar */}
        <View style={styles.transcribeBar}>
          <TouchableOpacity
            style={styles.langChip}
            onPress={() =>
              setSelectedLang(
                (selectedLang || resolvedTranscriptionLanguage) === "fr"
                  ? "en"
                  : "fr",
              )
            }
          >
            <Text style={styles.langChipText}>
              {(selectedLang || resolvedTranscriptionLanguage).toUpperCase()}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              transcription
                ? styles.retranscribeButton
                : styles.transcribeButton,
              isTranscribing && styles.transcribeButtonDisabled,
            ]}
            activeOpacity={0.7}
            onPress={handleTranscribe}
            disabled={isTranscribing}
          >
            {isTranscribing ? (
              <ActivityIndicator
                size="small"
                color={transcription ? colors.accent : "#fff"}
              />
            ) : (
              <Mic
                size={16}
                color={transcription ? colors.accent : "#fff"}
              />
            )}
            <Text
              style={
                transcription
                  ? styles.retranscribeButtonText
                  : styles.transcribeButtonText
              }
            >
              {isTranscribing
                ? t("audio.transcribingBtn")
                : transcription
                  ? t("audio.retranscribe")
                  : t("audio.transcribe")}
            </Text>
          </TouchableOpacity>
        </View>

        {transcribeError ? (
          <Text style={styles.errorText}>{transcribeError}</Text>
        ) : null}

        {/* Transcription body */}
        <View style={styles.transcriptionSection}>
          {transcription ? (
            <Text style={styles.transcriptionText}>{transcription.text}</Text>
          ) : (
            <View style={styles.emptyTranscription}>
              <Mic size={24} color={colors.textTertiary} />
              <Text style={styles.emptyTranscriptionText}>
                {t("audio.notTranscribed")}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    paddingBottom: spacing["3xl"],
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing["2xl"],
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.base,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  backText: {
    ...typography.body,
    color: colors.accent,
  },
  titleContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  titleInput: {
    ...typography.display,
    paddingVertical: spacing.sm,
  },
  titleText: {
    ...typography.display,
    paddingVertical: spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  metaText: {
    ...typography.small,
    color: colors.textTertiary,
    fontVariant: ["tabular-nums"],
  },
  titleDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderLight,
    marginTop: spacing.base,
  },
  playerSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    gap: spacing.md,
  },
  playButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.accentLight,
    borderWidth: 1,
    borderColor: colors.accentMuted,
  },
  playButtonText: {
    ...typography.bodyMedium,
    color: colors.accent,
  },
  progressContainer: {
    flex: 1,
    gap: 2,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    flexDirection: "row",
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  progressText: {
    ...typography.caption,
    fontVariant: ["tabular-nums"],
  },
  transcribeBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  langChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
  transcribeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
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
    paddingVertical: spacing.sm,
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
  errorText: {
    ...typography.small,
    color: colors.error,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  transcriptionSection: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
  },
  transcriptionText: {
    ...typography.body,
    lineHeight: 26,
  },
  emptyTranscription: {
    alignItems: "center",
    paddingVertical: spacing["3xl"],
    gap: spacing.sm,
  },
  emptyTranscriptionText: {
    ...typography.body,
    color: colors.textTertiary,
  },
});
