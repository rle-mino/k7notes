import React, { useCallback, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { orpc } from "@/lib/orpc";
import type { Note, Folder } from "@/lib/orpc";
import { NoteCard } from "@/components/notes/NoteCard";
import { FolderCard } from "@/components/notes/FolderCard";
import { EmptyState } from "@/components/notes/EmptyState";

type ListItem =
  | { type: "folder"; data: Folder }
  | { type: "note"; data: Note };

export default function NotesIndexScreen() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch root folder contents (folderId: null means root)
      const contents = await orpc.folders.getContents({ folderId: null });
      setFolders(contents.folders);
      setNotes(contents.notes);
    } catch (err) {
      console.error("Failed to fetch notes:", err);
      setError(err instanceof Error ? err.message : "Failed to load notes");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleRefresh = () => {
    fetchData(true);
  };

  const handleNotePress = (note: Note) => {
    router.push(`/notes/${note.id}`);
  };

  const handleFolderPress = (folder: Folder) => {
    router.push(`/notes/folder/${folder.id}`);
  };

  // Combine folders and notes into a single list
  const listItems: ListItem[] = [
    ...folders.map((folder) => ({ type: "folder" as const, data: folder })),
    ...notes.map((note) => ({ type: "note" as const, data: note })),
  ];

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === "folder") {
      return (
        <FolderCard
          folder={item.data}
          onPress={() => handleFolderPress(item.data)}
        />
      );
    }
    return (
      <NoteCard note={item.data} onPress={() => handleNotePress(item.data)} />
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchData()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (listItems.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          title="No notes yet"
          message="Create your first note to get started."
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={listItems}
        renderItem={renderItem}
        keyExtractor={(item) =>
          item.type === "folder" ? `folder-${item.data.id}` : `note-${item.data.id}`
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 32,
  },
  listContent: {
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#FF3B30",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
