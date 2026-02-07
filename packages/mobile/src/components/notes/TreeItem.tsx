import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Platform,
} from "react-native";
import {
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
  FilePlus,
  FolderPlus,
  Mic,
} from "lucide-react-native";
import type { TreeNode } from "@/hooks/useTreeData";
import type { Note } from "@/lib/orpc";
import type { AudioRecording } from "@/hooks/useAudioRecordings";
import { AudioCard } from "@/components/audio/AudioCard";
import { colors, typography, spacing, radius } from "@/theme";

const INDENT_WIDTH = 24;
const isWeb = Platform.OS === "web";

interface TreeItemProps {
  item: TreeNode;
  onPress: () => void;
  onToggleExpand?: () => void;
  onAddNote?: (folderId: string | null) => void;
  onAddFolder?: (parentFolderId: string | null) => void;
}

export function TreeItem({
  item,
  onPress,
  onToggleExpand,
  onAddNote,
  onAddFolder,
}: TreeItemProps) {
  const indentStyle = { paddingLeft: item.depth * INDENT_WIDTH + 12 };

  // Add item row (inside expanded folders)
  if (item.type === "add-item") {
    return (
      <View style={[styles.container, styles.addItemContainer, indentStyle]}>
        <View style={styles.expandPlaceholder} />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => onAddNote?.(item.parentFolderId)}
          activeOpacity={0.7}
        >
          <FilePlus size={15} color={colors.accent} strokeWidth={1.8} />
          <Text style={styles.addButtonText}>Add note</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => onAddFolder?.(item.parentFolderId)}
          activeOpacity={0.7}
        >
          <FolderPlus size={15} color={colors.folder} strokeWidth={1.8} />
          <Text style={styles.addButtonText}>Add folder</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Audio folder node
  if (item.type === "audio-folder") {
    return (
      <TouchableOpacity
        style={[styles.container, styles.folderContainer, indentStyle]}
        onPress={onToggleExpand}
        activeOpacity={0.7}
      >
        <View style={styles.expandIcon}>
          {item.hasChildren ? (
            item.isExpanded ? (
              <ChevronDown size={16} color={colors.textTertiary} />
            ) : (
              <ChevronRight size={16} color={colors.textTertiary} />
            )
          ) : (
            <View style={styles.expandPlaceholder} />
          )}
        </View>
        <View style={[styles.iconContainer, styles.audioIconBg]}>
          <Mic size={isWeb ? 14 : 16} color={colors.audio} strokeWidth={2} />
        </View>
        <Text style={styles.folderName} numberOfLines={1}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  }

  // Audio item node — renders the AudioCard component
  if (item.type === "audio-item") {
    return <AudioCard recording={item.data as AudioRecording} />;
  }

  if (item.type === "folder") {
    return (
      <TouchableOpacity
        style={[styles.container, styles.folderContainer, indentStyle]}
        onPress={onToggleExpand}
        activeOpacity={0.7}
      >
        <View style={styles.expandIcon}>
          {item.isLoading ? (
            <ActivityIndicator size="small" color={colors.textTertiary} />
          ) : item.hasChildren ? (
            item.isExpanded ? (
              <ChevronDown size={16} color={colors.textTertiary} />
            ) : (
              <ChevronRight size={16} color={colors.textTertiary} />
            )
          ) : (
            <View style={styles.expandPlaceholder} />
          )}
        </View>
        <View style={[styles.iconContainer, styles.folderIconBg]}>
          {item.isExpanded ? (
            <FolderOpen
              size={isWeb ? 14 : 16}
              color={colors.folder}
              fill={colors.folder}
              strokeWidth={1.5}
            />
          ) : (
            <Folder
              size={isWeb ? 14 : 16}
              color={colors.folder}
              fill={colors.folder}
              strokeWidth={1.5}
            />
          )}
        </View>
        <Text style={styles.folderName} numberOfLines={1}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  }

  // Note item
  const note = item.data as Note;
  const preview = note.content
    .split("\n")[0]
    .replace(/[#*`_~[\]]/g, "")
    .trim()
    .slice(0, 60);

  const formattedDate = new Date(note.updatedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <TouchableOpacity
      style={[styles.container, styles.noteContainer, indentStyle]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.expandPlaceholder} />
      <View style={[styles.iconContainer, styles.noteIconBg]}>
        <FileText
          size={isWeb ? 14 : 16}
          color={colors.noteIcon}
          strokeWidth={1.5}
        />
      </View>
      <View style={styles.noteContent}>
        <Text style={styles.noteTitle} numberOfLines={1}>
          {item.name}
        </Text>
        {preview ? (
          <Text style={styles.notePreview} numberOfLines={1}>
            {preview}
          </Text>
        ) : null}
      </View>
      <Text style={styles.noteDate}>{formattedDate}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: isWeb ? spacing.sm : spacing.md,
    paddingRight: spacing.base,
    minHeight: isWeb ? 48 : undefined,
  },
  folderContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  noteContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  addItemContainer: {
    backgroundColor: colors.background,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    gap: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  addButtonText: {
    ...typography.small,
    fontWeight: "500",
  },
  expandIcon: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  expandPlaceholder: {
    width: 24,
    height: 24,
  },
  iconContainer: {
    marginRight: spacing.sm,
    width: isWeb ? 24 : 28,
    height: isWeb ? 24 : 28,
    borderRadius: radius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  folderIconBg: {
    backgroundColor: colors.folderLight,
  },
  audioIconBg: {
    backgroundColor: colors.audioLight,
  },
  noteIconBg: {
    backgroundColor: colors.background,
  },
  folderName: {
    fontSize: isWeb ? 14 : 15,
    fontWeight: "600",
    color: colors.textPrimary,
    flex: 1,
  },
  noteContent: {
    flex: 1,
    gap: 2,
  },
  noteTitle: {
    fontSize: isWeb ? 14 : 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  notePreview: {
    fontSize: isWeb ? 12 : 13,
    fontWeight: "400",
    color: colors.textTertiary,
  },
  noteDate: {
    fontSize: 12,
    fontWeight: "400",
    color: colors.textTertiary,
    marginLeft: spacing.sm,
    fontVariant: ["tabular-nums"],
  },
});
