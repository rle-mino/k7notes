import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, Platform } from "react-native";
import { FileText } from "lucide-react-native";
import { colors, spacing, radius, shadows } from "@/theme";

interface NoteListItemProps {
  title: string;
  preview?: string;
  date: string;
  onPress: () => void;
}

const isWeb = Platform.OS === "web";

/**
 * Premium note card for list views (recents, search results).
 * Responsive density: compact on web, comfy on mobile.
 * Outlined note icon in cool gray, SemiBold title, 1-line preview,
 * right-aligned date with monospaced digits.
 */
export function NoteListItem({ title, preview, date, onPress }: NoteListItemProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <FileText
          size={isWeb ? 16 : 18}
          color={colors.noteIcon}
          strokeWidth={1.5}
        />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {title || "Untitled"}
          </Text>
          <Text style={styles.date}>{date}</Text>
        </View>
        {preview ? (
          <Text style={styles.preview} numberOfLines={1}>
            {preview}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: isWeb ? spacing.md : spacing.base,
    marginHorizontal: spacing.base,
    marginVertical: spacing.xs,
    minHeight: isWeb ? 48 : 64,
    ...shadows.sm,
  },
  iconContainer: {
    width: isWeb ? 28 : 32,
    height: isWeb ? 28 : 32,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: isWeb ? 14 : 16,
    fontWeight: "600",
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.md,
  },
  date: {
    fontSize: 12,
    fontWeight: "400",
    color: colors.textTertiary,
    fontVariant: ["tabular-nums"],
  },
  preview: {
    fontSize: isWeb ? 13 : 14,
    fontWeight: "400",
    color: colors.textTertiary,
    lineHeight: isWeb ? 18 : 20,
    marginTop: 2,
  },
});
