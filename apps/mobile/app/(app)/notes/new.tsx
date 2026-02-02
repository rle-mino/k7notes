import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { orpc } from "@/lib/orpc";

/**
 * This screen immediately creates a new untitled note and navigates to the editor.
 * The main note creation flow uses CreateNoteModal from the notes index.
 * This route exists for quick-create actions (e.g., from tab bar record button).
 */
export default function NewNoteScreen() {
  const { folderId } = useLocalSearchParams<{ folderId?: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createNote = async () => {
      try {
        const newNote = await orpc.notes.create({
          title: "Untitled",
          content: "",
          folderId: folderId || null,
        });
        // Navigate to the editor, replacing this screen in the history
        router.replace(`/notes/${newNote.id}`);
      } catch (err) {
        console.error("Failed to create note:", err);
        setError(
          err instanceof Error ? err.message : "Failed to create note"
        );
      }
    };

    createNote();
  }, [folderId]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Failed to create note</Text>
        <Text style={styles.errorMessage}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Creating note...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
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
  },
});
