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
import { useLocalSearchParams, Stack } from "expo-router";
import {
  Calendar,
  MapPin,
  Users,
  AlertCircle,
  CalendarDays,
} from "lucide-react-native";
import { orpc } from "@/lib/orpc";
import type { CalendarEvent, CalendarInfo } from "@/lib/orpc";
import { storage } from "@/lib/storage";

const SELECTED_CALENDARS_KEY = "k7notes_selected_calendars_";

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatEventDate(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = date.toDateString() === today.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  if (isToday) return "Today";
  if (isTomorrow) return "Tomorrow";

  return date.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getDateKey(date: Date): string {
  return date.toDateString();
}

interface EventWithDate extends CalendarEvent {
  dateKey: string;
  dateLabel: string;
}

interface EventItemProps {
  event: EventWithDate;
  showDateHeader: boolean;
}

function EventItem({ event, showDateHeader }: EventItemProps) {
  const startDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);
  const startTime = formatTime(startDate);
  const endTime = formatTime(endDate);

  return (
    <View>
      {showDateHeader && (
        <View style={styles.dateHeader}>
          <CalendarDays size={14} color="#007AFF" />
          <Text style={styles.dateHeaderText}>{event.dateLabel}</Text>
        </View>
      )}
      <View style={styles.eventItem}>
        <View style={styles.eventTime}>
          {event.isAllDay ? (
            <Text style={styles.allDayText}>All day</Text>
          ) : (
            <>
              <Text style={styles.eventTimeText}>{startTime}</Text>
              <Text style={styles.eventTimeSeparator}>-</Text>
              <Text style={styles.eventTimeText}>{endTime}</Text>
            </>
          )}
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
    </View>
  );
}

export default function CalendarEventsScreen() {
  const { id: connectionId } = useLocalSearchParams<{ id: string }>();

  const [events, setEvents] = useState<EventWithDate[]>([]);
  const [calendars, setCalendars] = useState<CalendarInfo[]>([]);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load selected calendars from storage
  useEffect(() => {
    async function loadSelectedCalendars() {
      if (!connectionId) return;
      try {
        const stored = await storage.getItem(SELECTED_CALENDARS_KEY + connectionId);
        if (stored) {
          setSelectedCalendarIds(new Set(JSON.parse(stored)));
        }
      } catch {
        // Ignore errors, use defaults
      }
    }
    loadSelectedCalendars();
  }, [connectionId]);

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

        // Fetch calendars first
        const calendarsResult = await orpc.calendar.listCalendars({ connectionId });
        setCalendars(calendarsResult);

        // Load selected calendars from storage or default to all
        let selectedIds: Set<string>;
        const stored = await storage.getItem(SELECTED_CALENDARS_KEY + connectionId);
        if (stored) {
          selectedIds = new Set(JSON.parse(stored));
        } else {
          // Default to all calendars
          selectedIds = new Set(calendarsResult.map((c) => c.id));
        }
        setSelectedCalendarIds(selectedIds);

        // Fetch events for the next 90 days (to get enough events)
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() + 90);

        // Fetch events for all selected calendars
        const allEvents: CalendarEvent[] = [];
        const calendarIdsToFetch = Array.from(selectedIds).filter((id) =>
          calendarsResult.some((c) => c.id === id)
        );

        // If no calendars selected, fetch primary
        if (calendarIdsToFetch.length === 0 && calendarsResult.length > 0) {
          const primary = calendarsResult.find((c) => c.isPrimary) || calendarsResult[0];
          calendarIdsToFetch.push(primary.id);
        }

        // Fetch events from each selected calendar
        await Promise.all(
          calendarIdsToFetch.map(async (calendarId) => {
            try {
              const eventsResult = await orpc.calendar.listEvents({
                connectionId,
                calendarId,
                startDate: now,
                endDate,
                maxResults: 20,
              });
              allEvents.push(...eventsResult);
            } catch (err) {
              console.warn(`Failed to fetch events for calendar ${calendarId}:`, err);
            }
          })
        );

        // Sort by start time and take first 20
        const sortedEvents = allEvents
          .filter((e) => e.status !== "cancelled")
          .sort(
            (a, b) =>
              new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          )
          .slice(0, 20);

        // Add date info for grouping
        const eventsWithDates: EventWithDate[] = sortedEvents.map((event) => {
          const startDate = new Date(event.startTime);
          return {
            ...event,
            dateKey: getDateKey(startDate),
            dateLabel: formatEventDate(startDate),
          };
        });

        setEvents(eventsWithDates);
      } catch (err) {
        console.error("Failed to fetch calendar data:", err);
        setError(err instanceof Error ? err.message : "Failed to load calendar");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [connectionId]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const primaryCalendar = calendars.find((c) => c.isPrimary);

  if (loading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: "Calendar" }} />
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading events...</Text>
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

  // Track which date headers have been shown
  let lastDateKey = "";

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: primaryCalendar?.name || "Calendar",
          headerBackTitle: "Settings",
        }}
      />

      {/* Header info */}
      <View style={styles.header}>
        <Calendar size={16} color="#666" />
        <Text style={styles.headerText}>
          Next {events.length} upcoming event{events.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Calendar size={48} color="#ccc" />
          <Text style={styles.emptyText}>No upcoming events</Text>
          <Text style={styles.emptySubtext}>
            Your calendar events will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={({ item }) => {
            const showDateHeader = item.dateKey !== lastDateKey;
            lastDateKey = item.dateKey;
            return <EventItem event={item} showDateHeader={showDateHeader} />;
          }}
          contentContainerStyle={styles.eventsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchData(true)}
              tintColor="#007AFF"
            />
          }
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  headerText: {
    fontSize: 14,
    color: "#666",
  },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 4,
  },
  dateHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
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
  eventItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
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
  allDayText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#007AFF",
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
