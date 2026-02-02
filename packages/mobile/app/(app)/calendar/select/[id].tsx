import React, { useState, useCallback, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Switch,
} from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { AlertCircle } from "lucide-react-native";
import { orpc } from "@/lib/orpc";
import type { CalendarInfo } from "@/lib/orpc";
import { storage } from "@/lib/storage";

const SELECTED_CALENDARS_KEY = "k7notes_selected_calendars_";

interface CalendarItemProps {
  calendar: CalendarInfo;
  isSelected: boolean;
  onToggle: (calendarId: string) => void;
}

function CalendarItem({ calendar, isSelected, onToggle }: CalendarItemProps) {
  return (
    <TouchableOpacity
      style={styles.calendarItem}
      onPress={() => onToggle(calendar.id)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.colorDot,
          { backgroundColor: calendar.backgroundColor || "#007AFF" },
        ]}
      />
      <View style={styles.calendarInfo}>
        <Text style={styles.calendarName}>{calendar.name}</Text>
        {calendar.description && (
          <Text style={styles.calendarDescription} numberOfLines={1}>
            {calendar.description}
          </Text>
        )}
        {calendar.isPrimary && (
          <View style={styles.primaryBadge}>
            <Text style={styles.primaryBadgeText}>Primary</Text>
          </View>
        )}
      </View>
      <Switch
        value={isSelected}
        onValueChange={() => onToggle(calendar.id)}
        trackColor={{ false: "#ddd", true: "#34C759" }}
        thumbColor="#fff"
      />
    </TouchableOpacity>
  );
}

export default function SelectCalendarsScreen() {
  const { id: connectionId } = useLocalSearchParams<{ id: string }>();

  const [calendars, setCalendars] = useState<CalendarInfo[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchCalendars = useCallback(async () => {
    if (!connectionId) return;

    try {
      setLoading(true);
      setError(null);

      const calendarsResult = await orpc.calendar.listCalendars({ connectionId });
      setCalendars(calendarsResult);

      // Load selected calendars from storage
      const stored = await storage.getItem(SELECTED_CALENDARS_KEY + connectionId);
      if (stored) {
        setSelectedIds(new Set(JSON.parse(stored)));
      } else {
        // Default to all calendars selected
        setSelectedIds(new Set(calendarsResult.map((c) => c.id)));
      }
    } catch (err) {
      console.error("Failed to fetch calendars:", err);
      setError(err instanceof Error ? err.message : "Failed to load calendars");
    } finally {
      setLoading(false);
    }
  }, [connectionId]);

  useEffect(() => {
    fetchCalendars();
  }, [fetchCalendars]);

  const handleToggle = (calendarId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(calendarId)) {
        // Don't allow deselecting all calendars
        if (next.size > 1) {
          next.delete(calendarId);
        }
      } else {
        next.add(calendarId);
      }
      return next;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!connectionId) return;

    try {
      setSaving(true);
      await storage.setItem(
        SELECTED_CALENDARS_KEY + connectionId,
        JSON.stringify(Array.from(selectedIds))
      );
      router.back();
    } catch (err) {
      console.error("Failed to save calendar selection:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(calendars.map((c) => c.id)));
    setHasChanges(true);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: "Select Calendars" }} />
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading calendars...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: "Select Calendars" }} />
        <AlertCircle size={48} color="#FF3B30" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchCalendars}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Select Calendars",
          headerBackTitle: "Back",
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving || !hasChanges}
              style={styles.saveButton}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Text
                  style={[
                    styles.saveButtonText,
                    !hasChanges && styles.saveButtonTextDisabled,
                  ]}
                >
                  Done
                </Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.header}>
        <Text style={styles.headerText}>
          Choose which calendars to show events from
        </Text>
        <TouchableOpacity onPress={handleSelectAll}>
          <Text style={styles.selectAllText}>Select All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={calendars}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CalendarItem
            calendar={item}
            isSelected={selectedIds.has(item.id)}
            onToggle={handleToggle}
          />
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {selectedIds.size} of {calendars.length} calendar
          {calendars.length !== 1 ? "s" : ""} selected
        </Text>
      </View>
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
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    fontSize: 15,
    color: "#666",
    marginTop: 12,
  },
  errorText: {
    fontSize: 15,
    color: "#FF3B30",
    marginTop: 12,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  saveButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#007AFF",
  },
  saveButtonTextDisabled: {
    color: "#ccc",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  headerText: {
    fontSize: 13,
    color: "#666",
    flex: 1,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
  list: {
    backgroundColor: "#fff",
    marginTop: 16,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#eee",
    marginLeft: 56,
  },
  calendarItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  calendarInfo: {
    flex: 1,
  },
  calendarName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1a1a1a",
  },
  calendarDescription: {
    fontSize: 13,
    color: "#999",
    marginTop: 2,
  },
  primaryBadge: {
    marginTop: 4,
    alignSelf: "flex-start",
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: "#E5F1FF",
    borderRadius: 4,
  },
  primaryBadgeText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#007AFF",
  },
  footer: {
    padding: 16,
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    color: "#999",
  },
});
