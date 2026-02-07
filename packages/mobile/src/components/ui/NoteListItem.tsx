import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, typography, spacing, radius, shadows } from "@/theme";

interface NoteListItemProps {
  title: string;
  preview?: string;
  date: string;
  onPress: () => void;
}

/**
 * Premium note card for list views (recents, search results).
 * Clean vertical rhythm: Bold title on top, 2-line gray preview below,
 * date aligned right. Uses whitespace instead of borders for separation.
 */
export function NoteListItem({ title, preview, date, onPress }: NoteListItemProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {title || "Untitled"}
        </Text>
        <Text style={styles.date}>{date}</Text>
      </View>
      {preview ? (
        <Text style={styles.preview} numberOfLines={2}>
          {preview}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginHorizontal: spacing.base,
    marginVertical: spacing.xs,
    ...shadows.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.bodyMedium,
    fontWeight: "600",
    flex: 1,
    marginRight: spacing.md,
  },
  date: {
    ...typography.caption,
  },
  preview: {
    ...typography.small,
    lineHeight: 20,
  },
});
