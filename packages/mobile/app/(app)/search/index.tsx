import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { orpc } from "@/lib/orpc";
import type { SearchResult } from "@/lib/orpc";
import { NoteListItem } from "@/components/ui/NoteListItem";
import { colors, typography, spacing, radius, layout } from "@/theme";

export default function SearchScreen() {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);

      const searchResults = await orpc.notes.search({ q: trimmed });
      setResults(searchResults);
    } catch (err) {
      console.error("Search failed:", err);
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleNotePress = (noteId: string) => {
    router.push(`/notes/${noteId}`);
  };

  const renderResult = ({ item }: { item: SearchResult }) => {
    const formattedDate = new Date(item.note.updatedAt).toLocaleDateString(
      i18n.language,
      { month: "short", day: "numeric" }
    );

    return (
      <NoteListItem
        title={item.note.title || t("notes.untitled")}
        preview={item.snippet}
        date={formattedDate}
        onPress={() => handleNotePress(item.note.id)}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t("search.placeholder")}
          placeholderTextColor={colors.textTertiary}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => handleSearch(query)}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => handleSearch(query)}
          >
            <Text style={styles.retryButtonText}>{t("search.retry")}</Text>
          </TouchableOpacity>
        </View>
      ) : hasSearched && results.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>{t("search.noResults")}</Text>
          <Text style={styles.emptyMessage}>
            {t("search.noResultsFor", { query })}
          </Text>
        </View>
      ) : !hasSearched ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>{t("search.searchYourNotes")}</Text>
          <Text style={styles.emptyMessage}>
            {t("search.searchHint")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderResult}
          keyExtractor={(item) => item.note.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  searchInput: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    ...typography.body,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
