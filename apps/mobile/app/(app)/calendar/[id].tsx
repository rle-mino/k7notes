import React, { useState, useCallback, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react-native";
import { orpc } from "@/lib/orpc";
import type { CalendarEvent, CalendarInfo } from "@/lib/orpc";

const PROVIDER_COLORS: Record<string, string> = {
  google: "#4285F4",
  microsoft: "#0078D4",
};

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatDateRange(startDate: Date, endDate: Date): string {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  return `${start} - ${end}`;
}

interface EventItemProps {
  event: CalendarEvent;
}

function EventItem({ event }: EventItemProps) {
  const startTime = formatTime(event.startTime);
  const endTime = formatTime(event.endTime);

  return (
    <View style={styles.eventItem}>
      <View style={styles.eventTime}>
        <Text style={styles.eventTimeText}>{startTime}</Text>
        <Text style={styles.eventTimeSeparator}>-</Text>
        <Text style={styles.eventTimeText}>{endTime}</Text>
      </View>
      <View style={styles.eventContent}>
        <Text style={styles.eventTitle} numberOfLines={2}>
          {event.title}
        </Text>
        {event.location && (
          <View style={styles.eventMeta}>
            <MapPin size={12} color="#999" />
            <Text style={styles.eventMetaText} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
        )}
        {event.attendees.length > 0 && (
          <View style={styles.eventMeta}>
            <Users size={12} color="#999" />
            <Text style={styles.eventMetaText}>
              {event.attendees.length} attendee
              {event.attendees.length > 1 ? "s" : ""}
            </Text>
          </View>
        )}
        {event.status === "tentative" && (
          <View style={styles.tentativeBadge}>
            <Text style={styles.tentativeText}>Tentative</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function CalendarEventsScreen() {
  const { id: connectionId } = useLocalSearchParams<{ id: string }>();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<CalendarInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Date range state (show one week by default)
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [endDate, setEndDate] = useState(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(23, 59, 59, 999);
    return nextWeek;
  });

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (!connectionId) return;

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        // Fetch calendars and events in parallel
        const [calendarsResult, eventsResult] = await Promise.all([
          orpc.calendar.listCalendars({ connectionId }),
          orpc.calendar.listEvents({
            connectionId,
            startDate,
            endDate,
            maxResults: 50,
          }),
        ]);

        setCalendars(calendarsResult);
        setEvents(eventsResult);
      } catch (err) {
        console.error("Failed to fetch calendar data:", err);
        setError(err instanceof Error ? err.message : "Failed to load calendar");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [connectionId, startDate, endDate]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const goToPreviousWeek = () => {
    setStartDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 7);
      return newDate;
    });
    setEndDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 7);
      return newDate;
    });
  };

  const goToNextWeek = () => {
    setStartDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 7);
      return newDate;
    });
    setEndDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 7);
      return newDate;
    });
  };

  const goToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(23, 59, 59, 999);
    setStartDate(today);
    setEndDate(nextWeek);
  };

  const primaryCalendar = calendars.find((c) => c.isPrimary);

  if (loading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: "Calendar" }} />
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading calendar...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: "Calendar" }} />
        <AlertCircle size={48} color="#FF3B30" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchData()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: primaryCalendar?.name || "Calendar",
          headerBackTitle: "Settings",
        }}
      />

      {/* Date Navigation */}
      <View style={styles.dateNavigation}>
        <TouchableOpacity style={styles.navButton} onPress={goToPreviousWeek}>
          <ChevronLeft size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateRange} onPress={goToToday}>
          <Calendar size={16} color="#666" />
          <Text style={styles.dateRangeText}>
            {formatDateRange(startDate, endDate)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={goToNextWeek}>
          <ChevronRight size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Calendar size={48} color="#ccc" />
          <Text style={styles.emptyText}>No events this week</Text>
          <Text style={styles.emptySubtext}>
            Your calendar events will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EventItem event={item} />}
          contentContainerStyle={styles.eventsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchData(true)}
              tintColor="#007AFF"
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
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
  dateNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  navButton: {
    padding: 8,
  },
  dateRange: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  dateRangeText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
  },
  eventsList: {
    padding: 16,
  },
  separator: {
    height: 12,
  },
  eventItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  eventTime: {
    width: 60,
    marginRight: 12,
  },
  eventTimeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
  },
  eventTimeSeparator: {
    fontSize: 12,
    color: "#ccc",
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  eventMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  eventMetaText: {
    fontSize: 12,
    color: "#999",
  },
  tentativeBadge: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingVertical: 2,
    paddingHorizontal: 8,
    backgroundColor: "#FEF3C7",
    borderRadius: 4,
  },
  tentativeText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#D97706",
  },
});
