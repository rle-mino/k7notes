import React, { useState, useCallback, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { orpc } from "@/lib/orpc";
import { NoteEditor, type NoteEditorRef } from "@/components/editor/NoteEditor";

export default function NewNoteScreen() {
  const insets = useSafeAreaInsets();
  const { folderId } = useLocalSearchParams<{ folderId?: string }>();
  const editorRef = useRef<NoteEditorRef>(null);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  // Track editor content via callback (more reliable than getMarkdown on mobile)
  const contentRef = useRef("");

  const handleContentChange = useCallback((markdown: string) => {
    contentRef.current = markdown;
  }, []);

  const handleSave = useCallback(async () => {
    // Try to get content from ref first (set by onContentChange),
    // fall back to getMarkdown() if empty
    let content = contentRef.current;
    if (!content && editorRef.current) {
      try {
        content = await editorRef.current.getMarkdown();
      } catch (e) {
        console.error("[NewNote] Failed to get markdown:", e);
      }
    }

    if (!title.trim() && !content.trim()) {
      Alert.alert("Empty Note", "Please add a title or content to your note.");
      return;
    }

    try {
      setSaving(true);
      const newNote = await orpc.notes.create({
        title: title.trim() || "Untitled",
        content: content.trim(),
        folderId: folderId || null,
      });

      // Navigate to the new note for editing
      router.replace(`/notes/${newNote.id}`);
    } catch (err) {
      console.error("Failed to create note:", err);
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to create note. Please try again."
      );
      setSaving(false);
    }
  }, [title, folderId]);

  const handleCancel = useCallback(() => {
    if (title.trim() || contentRef.current) {
      Alert.alert(
        "Discard Note?",
        "You have unsaved changes. Are you sure you want to discard them?",
        [
          { text: "Keep Editing", style: "cancel" },
          { text: "Discard", style: "destructive", onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  }, [title]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Note</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.headerButton, styles.saveButton]}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.titleContainer}>
        <TextInput
          style={styles.titleInput}
          placeholder="Title"
          placeholderTextColor="#999"
          value={title}
          onChangeText={setTitle}
          autoFocus
          returnKeyType="next"
          maxLength={200}
        />
      </View>

      <View style={styles.editorContainer}>
        <NoteEditor
          ref={editorRef}
          initialContent=""
          onContentChange={handleContentChange}
          editable={true}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 60,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  cancelText: {
    fontSize: 16,
    color: "#666",
  },
  saveButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 70,
  },
  saveText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
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
