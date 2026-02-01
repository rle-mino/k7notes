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
import type { Note } from "@/lib/orpc";

export default function RecentsScreen() {
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

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
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
    <TouchableOpacity
      style={styles.noteCard}
      onPress={() => handleNotePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.noteHeader}>
        <Text style={styles.noteTitle} numberOfLines={1}>
          {item.title || "Untitled"}
        </Text>
        <Text style={styles.noteDate}>{formatDate(item.updatedAt)}</Text>
      </View>
      {item.content && (
        <Text style={styles.notePreview} numberOfLines={2}>
          {getPreview(item.content)}
        </Text>
      )}
    </TouchableOpacity>
  );

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
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchRecentNotes()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (notes.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>No recent notes</Text>
        <Text style={styles.emptyMessage}>
          Notes you create or edit will appear here.
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
  noteCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  noteTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1a1a1a",
    flex: 1,
    marginRight: 12,
  },
  noteDate: {
    fontSize: 12,
    color: "#999",
  },
  notePreview: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
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
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyMessage: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
});
