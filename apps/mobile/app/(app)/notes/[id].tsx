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
import { orpc, type Note } from "@/lib/orpc";
import { NoteEditor, type NoteEditorRef } from "@/components/editor/NoteEditor";

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

  // Loading state
  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: "Loading..." }} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
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
          <Text style={styles.errorIcon}>⚠️</Text>
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
          <Text style={styles.errorIcon}>📝</Text>
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
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerRight}>
              {saving ? (
                <View style={styles.savingIndicator}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.savingText}>Saving...</Text>
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
            placeholderTextColor="#999"
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
    backgroundColor: "#fff",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  backText: {
    fontSize: 16,
    color: "#007AFF",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
  },
  savingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  savingText: {
    fontSize: 14,
    color: "#007AFF",
  },
  savedText: {
    fontSize: 14,
    color: "#34C759",
  },
  titleContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1a1a1a",
    paddingVertical: 8,
  },
  editorContainer: {
    flex: 1,
  },
});
