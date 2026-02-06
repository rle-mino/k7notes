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
import { router, Stack, useFocusEffect } from "expo-router";
import { FolderPlus, FilePlus } from "lucide-react-native";
import { useTreeData, type TreeNode } from "@/hooks/useTreeData";
import { TreeItem } from "@/components/notes/TreeItem";
import { EmptyState } from "@/components/notes/EmptyState";
import { CreateFolderModal } from "@/components/notes/CreateFolderModal";
import { CreateNoteModal } from "@/components/notes/CreateNoteModal";
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

  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [folderModalParentId, setFolderModalParentId] = useState<string | null>(
    null
  );
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteModalFolderId, setNoteModalFolderId] = useState<string | null>(
    null
  );

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

  const handleAddNote = (folderId: string | null) => {
    setNoteModalFolderId(folderId);
    setNoteModalVisible(true);
  };

  const handleAddFolder = (parentFolderId: string | null) => {
    setFolderModalParentId(parentFolderId);
    setFolderModalVisible(true);
  };

  const handleFolderCreated = () => {
    // Refresh to show the new folder
    refresh();
  };

  const renderItem = ({ item }: { item: TreeNode }) => {
    return (
      <TreeItem
        item={item}
        onPress={() => {
          if (item.type === "note") {
            handleNotePress(item.data as Note);
          }
        }}
        onToggleExpand={
          item.type === "folder"
            ? () => handleToggleExpand(item.id)
            : undefined
        }
        onAddNote={handleAddNote}
        onAddFolder={handleAddFolder}
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

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Notes",
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => handleAddFolder(null)}
              >
                <FolderPlus size={22} color="#F5A623" strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => handleAddNote(null)}
              >
                <FilePlus size={22} color="#007AFF" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {treeData.length === 0 ? (
        <EmptyState
          title="No notes yet"
          message="Create your first note or folder to get started."
        />
      ) : (
        <FlatList
          data={treeData}
          renderItem={renderItem}
          keyExtractor={(item) =>
            item.type === "folder"
              ? `folder-${item.id}`
              : item.type === "note"
                ? `note-${item.id}`
                : item.id
          }
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} />
          }
        />
      )}

      <CreateFolderModal
        visible={folderModalVisible}
        parentFolderId={folderModalParentId}
        onClose={() => setFolderModalVisible(false)}
        onCreated={handleFolderCreated}
      />

      <CreateNoteModal
        visible={noteModalVisible}
        folderId={noteModalFolderId}
        onClose={() => setNoteModalVisible(false)}
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
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
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
