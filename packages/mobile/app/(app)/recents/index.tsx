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
import { useTranslation } from "react-i18next";
import { orpc } from "@/lib/orpc";
import type { Note } from "@/lib/orpc";
import { NoteListItem } from "@/components/ui/NoteListItem";
import { colors, typography, spacing, radius, layout } from "@/theme";

export default function RecentsScreen() {
  const { t, i18n } = useTranslation();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentNotes = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch recent notes (using list endpoint, sorted by updatedAt)
      const recentNotes = await orpc.notes.list({});
      // Sort by updatedAt descending and take top 20
      const sorted = recentNotes
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 20);
      setNotes(sorted);
    } catch (err) {
      console.error("Failed to fetch recent notes:", err);
      setError(err instanceof Error ? err.message : "Failed to load recent notes");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRecentNotes();
    }, [fetchRecentNotes])
  );

  const handleRefresh = () => {
    fetchRecentNotes(true);
  };

  const handleNotePress = (note: Note) => {
    router.push(`/notes/${note.id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t("recents.justNow");
    if (diffMins < 60) return t("recents.minutesAgo", { count: diffMins });
    if (diffHours < 24) return t("recents.hoursAgo", { count: diffHours });
    if (diffDays === 1) return t("recents.yesterday");
    if (diffDays < 7) return t("recents.daysAgo", { count: diffDays });
    return date.toLocaleDateString(i18n.language, { month: "short", day: "numeric" });
  };

  const getPreview = (content: string) => {
    // Strip markdown/HTML and get first ~100 chars
    const stripped = content
      .replace(/[#*_~`>[\]()]/g, "")
      .replace(/<[^>]*>/g, "")
      .replace(/\n+/g, " ")
      .trim();
    return stripped.length > 100 ? stripped.substring(0, 100) + "..." : stripped;
  };

  const renderNote = ({ item }: { item: Note }) => (
    <NoteListItem
      title={item.title || t("notes.untitled")}
      preview={item.content ? getPreview(item.content) : undefined}
      date={formatDate(item.updatedAt)}
      onPress={() => handleNotePress(item)}
    />
  );

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
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchRecentNotes()}>
          <Text style={styles.retryButtonText}>{t("recents.retry")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (notes.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>{t("recents.noRecentNotes")}</Text>
        <Text style={styles.emptyMessage}>
          {t("recents.noRecentMessage")}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notes}
        renderItem={renderNote}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
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
  listContent: {
    paddingVertical: spacing.sm,
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
  emptyTitle: {
    ...typography.h2,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  emptyMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});
