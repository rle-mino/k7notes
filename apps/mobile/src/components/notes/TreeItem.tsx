import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import {
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
  FilePlus,
  FolderPlus,
} from "lucide-react-native";
import type { TreeNode } from "@/hooks/useTreeData";
import type { Note } from "@/lib/orpc";

const INDENT_WIDTH = 24;

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
          <FilePlus size={16} color="#007AFF" strokeWidth={2} />
          <Text style={styles.addButtonText}>Add note</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => onAddFolder?.(item.parentFolderId)}
          activeOpacity={0.7}
        >
          <FolderPlus size={16} color="#F5A623" strokeWidth={2} />
          <Text style={styles.addButtonText}>Add folder</Text>
        </TouchableOpacity>
      </View>
    );
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
            <ActivityIndicator size="small" color="#666" />
          ) : item.hasChildren ? (
            item.isExpanded ? (
              <ChevronDown size={18} color="#666" />
            ) : (
              <ChevronRight size={18} color="#666" />
            )
          ) : (
            <View style={styles.expandPlaceholder} />
          )}
        </View>
        <View style={styles.iconContainer}>
          {item.isExpanded ? (
            <FolderOpen size={20} color="#F5A623" strokeWidth={2} />
          ) : (
            <Folder size={20} color="#F5A623" strokeWidth={2} />
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
      <View style={styles.iconContainer}>
        <FileText size={18} color="#007AFF" strokeWidth={2} />
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
    paddingVertical: 10,
    paddingRight: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e5e5",
  },
  folderContainer: {
    backgroundColor: "#fafafa",
  },
  noteContainer: {
    backgroundColor: "#fff",
  },
  addItemContainer: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 8,
    gap: 8,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666",
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
    marginRight: 10,
    width: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  folderName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1a1a1a",
    flex: 1,
  },
  noteContent: {
    flex: 1,
    gap: 2,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1a1a1a",
  },
  notePreview: {
    fontSize: 13,
    color: "#888",
  },
  noteDate: {
    fontSize: 12,
    color: "#999",
    marginLeft: 8,
  },
});
