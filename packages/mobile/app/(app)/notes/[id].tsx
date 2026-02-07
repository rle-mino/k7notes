import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Trash2, RefreshCw, ChevronLeft } from "lucide-react-native";
import { orpc, type Note } from "@/lib/orpc";
import { NoteEditor, type NoteEditorRef } from "@/components/editor/NoteEditor";
import { colors, typography, spacing, radius } from "@/theme";

const AUTOSAVE_DELAY_MS = 5000;

export default function NoteEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const editorRef = useRef<NoteEditorRef>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Track pending changes for debounced save
  const pendingContentRef = useRef<string | null>(null);
  const pendingTitleRef = useRef<string | null>(null);

  // Fetch note on mount
  useEffect(() => {
    if (!id) {
      setError("No note ID provided");
      setLoading(false);
      return;
    }

    const fetchNote = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedNote = await orpc.notes.findOne({ id });
        setNote(fetchedNote);
        setTitle(fetchedNote.title);
        setLastSaved(new Date(fetchedNote.updatedAt));
      } catch (err) {
        console.error("Failed to fetch note:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load note"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [id]);

  // Save function
  const saveNote = useCallback(async (newTitle?: string, newContent?: string) => {
    if (!id || !note) return;

    const titleToSave = newTitle ?? pendingTitleRef.current ?? title;
    const contentToSave = newContent ?? pendingContentRef.current;

    // Nothing to save
    if (titleToSave === note.title && contentToSave === null) return;

    try {
      setSaving(true);
      const updateData: { title?: string; content?: string } = {};

      if (titleToSave !== note.title) {
        updateData.title = titleToSave;
      }
      if (contentToSave !== null) {
        updateData.content = contentToSave;
      }

      const updatedNote = await orpc.notes.update({ id, ...updateData });
      setNote(updatedNote);
      setLastSaved(new Date());

      // Clear pending changes
      pendingContentRef.current = null;
      pendingTitleRef.current = null;
    } catch (err) {
      console.error("Failed to save note:", err);
      Alert.alert(
        "Save Failed",
        err instanceof Error ? err.message : "Could not save your changes. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }, [id, note, title]);

  // Schedule debounced save
  const scheduleSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveNote();
    }, AUTOSAVE_DELAY_MS);
  }, [saveNote]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Save immediately on unmount if there are pending changes
  useEffect(() => {
    return () => {
      if (pendingContentRef.current !== null || pendingTitleRef.current !== null) {
        // Fire and forget - component is unmounting
        saveNote();
      }
    };
  }, [saveNote]);

  // Handle title changes
  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
    pendingTitleRef.current = newTitle;
    scheduleSave();
  }, [scheduleSave]);

  // Handle content changes from editor
  const handleContentChange = useCallback((markdown: string) => {
    pendingContentRef.current = markdown;
    scheduleSave();
  }, [scheduleSave]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    // Save any pending changes before navigating away
    if (pendingContentRef.current !== null || pendingTitleRef.current !== null) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveNote();
    }
    router.back();
  }, [saveNote]);

  // Handle delete
  const handleDelete = useCallback(() => {
    if (!id) return;

    Alert.alert(
      "Delete Note?",
      "This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              // Cancel any pending save
              if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
                saveTimeoutRef.current = null;
              }
              // Clear pending changes so unmount doesn't try to save
              pendingContentRef.current = null;
              pendingTitleRef.current = null;

              await orpc.notes.delete({ id });
              router.back();
            } catch (err) {
              console.error("Failed to delete note:", err);
              setDeleting(false);
              Alert.alert(
                "Delete Failed",
                err instanceof Error ? err.message : "Could not delete the note. Please try again."
              );
            }
          },
        },
      ]
    );
  }, [id]);

  // Handle calendar refresh for daily notes
  const handleRefreshCalendar = useCallback(async () => {
    if (!id || !note || note.kind !== "DAILY") return;

    try {
      setRefreshing(true);
      const updatedNote = await orpc.notes.refreshDailyNoteEvents({ noteId: id });
      setNote(updatedNote);
      editorRef.current?.setMarkdown(updatedNote.content);
    } catch (err) {
      console.error("Failed to refresh calendar events:", err);
      Alert.alert(
        "Refresh Failed",
        err instanceof Error ? err.message : "Could not refresh calendar events. Please try again."
      );
    } finally {
      setRefreshing(false);
    }
  }, [id, note]);

  // Loading state
  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: "Loading..." }} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading note...</Text>
        </View>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Stack.Screen options={{ title: "Error" }} />
        <View style={styles.centerContainer}>
          <Text style={styles.errorTitle}>Failed to load note</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  // No note found
  if (!note) {
    return (
      <>
        <Stack.Screen options={{ title: "Not Found" }} />
        <View style={styles.centerContainer}>
          <Text style={styles.errorTitle}>Note not found</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
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
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerRight}>
              {note.kind === "DAILY" && (
                <TouchableOpacity
                  onPress={handleRefreshCalendar}
                  disabled={refreshing || saving || deleting}
                  style={[
                    styles.headerAction,
                    (refreshing || saving || deleting) && styles.headerActionDisabled,
                  ]}
                >
                  {refreshing ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <RefreshCw size={18} color={colors.accent} strokeWidth={1.8} />
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleDelete}
                disabled={saving || deleting}
                style={[
                  styles.headerAction,
                  (saving || deleting) && styles.headerActionDisabled,
                ]}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color={colors.error} />
                ) : (
                  <Trash2 size={18} color={colors.error} strokeWidth={1.8} />
                )}
              </TouchableOpacity>
              {saving ? (
                <View style={styles.saveStatus}>
                  <ActivityIndicator size="small" color={colors.accent} />
                  <Text style={styles.savingText}>Saving</Text>
                </View>
              ) : lastSaved ? (
                <Text style={styles.savedText}>Saved</Text>
              ) : null}
            </View>
          ),
        }}
      />
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <View style={styles.titleContainer}>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={handleTitleChange}
            placeholder="Untitled"
            placeholderTextColor={colors.textTertiary}
            maxLength={200}
            returnKeyType="next"
          />
        </View>
        <View style={styles.editorContainer}>
          <NoteEditor
            ref={editorRef}
            initialContent={note.content ?? ""}
            onContentChange={handleContentChange}
            editable={true}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
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
  errorTitle: {
    ...typography.h2,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  retryButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  retryText: {
    ...typography.bodyMedium,
    color: colors.textInverse,
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: spacing.sm,
    gap: spacing.md,
  },
  headerAction: {
    padding: spacing.xs,
  },
  headerActionDisabled: {
    opacity: 0.4,
  },
  saveStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  savingText: {
    ...typography.caption,
    color: colors.accent,
  },
  savedText: {
    ...typography.caption,
    color: colors.success,
  },
  titleContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  titleInput: {
    ...typography.display,
    paddingVertical: spacing.sm,
  },
  editorContainer: {
    flex: 1,
  },
});
