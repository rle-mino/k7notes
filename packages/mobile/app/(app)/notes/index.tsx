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
import { useTranslation } from "react-i18next";
import { FolderPlus, FilePlus } from "lucide-react-native";
import { useTreeData, type TreeNode } from "@/hooks/useTreeData";
import { TreeItem } from "@/components/notes/TreeItem";
import { EmptyState } from "@/components/notes/EmptyState";
import { CreateFolderModal } from "@/components/notes/CreateFolderModal";
import { CreateNoteModal } from "@/components/notes/CreateNoteModal";
import { DailyNoteDatePicker } from "@/components/daily/DailyNoteDatePicker";
import type { Note } from "@/lib/orpc";
import type { AudioRecording } from "@/hooks/useAudioRecordings";
import { colors, typography, spacing, radius, layout } from "@/theme";

export default function NotesIndexScreen() {
  const { t } = useTranslation();
  const {
    treeData,
    dailyFolderId,
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
  const [dailyPickerVisible, setDailyPickerVisible] = useState(false);

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
    // Open date picker for the root "Daily" folder instead of the regular modal
    if (folderId != null && folderId === dailyFolderId) {
      setDailyPickerVisible(true);
      return;
    }
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
          } else if (item.type === "audio-item") {
            const recording = item.data as AudioRecording;
            router.push(`/notes/audio/${recording.fileName}`);
          }
        }}
        onToggleExpand={
          item.type === "folder" || item.type === "audio-folder"
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
        <ActivityIndicator size="large" color={colors.accent} />
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
          <Text style={styles.retryButtonText}>{t("notes.retry")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t("notes.title"),
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => handleAddFolder(null)}
              >
                <FolderPlus size={20} color={colors.folder} strokeWidth={1.8} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => handleAddNote(null)}
              >
                <FilePlus size={20} color={colors.accent} strokeWidth={1.8} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {treeData.length === 0 ? (
        <EmptyState
          title={t("notes.noNotesYet")}
          message={t("notes.noNotesMessage")}
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
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={colors.accent}
            />
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

      <DailyNoteDatePicker
        visible={dailyPickerVisible}
        onClose={() => setDailyPickerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: spacing["2xl"],
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  headerButton: {
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingVertical: spacing.xs,
    paddingBottom: layout.bottomPadding,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: "center",
    marginBottom: spacing.base,
  },
  retryButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  retryButtonText: {
    ...typography.bodyMedium,
    color: colors.textInverse,
  },
});
