import React, { useCallback } from "react";
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
import { useTreeData, type TreeNode } from "@/hooks/useTreeData";
import { TreeItem } from "@/components/notes/TreeItem";
import { EmptyState } from "@/components/notes/EmptyState";
import type { Note } from "@/lib/orpc";

export default function NotesIndexScreen() {
  const {
    treeData,
    loading,
    refreshing,
    error,
    fetchRootData,
    toggleExpand,
    refresh,
  } = useTreeData();

  // Refetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchRootData();
    }, [fetchRootData])
  );

  const handleNotePress = (note: Note) => {
    router.push(`/notes/${note.id}`);
  };

  const handleToggleExpand = (folderId: string) => {
    toggleExpand(folderId);
  };

  const renderItem = ({ item }: { item: TreeNode }) => {
    if (item.type === "folder") {
      return (
        <TreeItem
          item={item}
          onPress={() => {}}
          onToggleExpand={() => handleToggleExpand(item.id)}
        />
      );
    }
    return (
      <TreeItem
        item={item}
        onPress={() => handleNotePress(item.data as Note)}
      />
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
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchRootData()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (treeData.length === 0) {
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
        data={treeData}
        renderItem={renderItem}
        keyExtractor={(item) =>
          item.type === "folder" ? `folder-${item.id}` : `note-${item.id}`
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
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
    paddingVertical: 4,
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
