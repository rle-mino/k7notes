import React, { useState, useCallback, useMemo } from "react";
import {
  StyleSheet,
  View,
  Modal,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { ChevronLeft, ChevronRight, X } from "lucide-react-native";
import { orpc } from "@/lib/orpc";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function generateCalendarDays(year: number, month: number): (number | null)[] {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const days: (number | null)[] = [];

  // Blanks before the 1st
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  // Pad to fill last row
  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

function formatDateISO(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function isSameDate(
  year: number,
  month: number,
  day: number,
  today: Date
): boolean {
  return (
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day
  );
}

interface DailyNoteDatePickerProps {
  visible: boolean;
  onClose: () => void;
}

export function DailyNoteDatePicker({
  visible,
  onClose,
}: DailyNoteDatePickerProps) {
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calendarDays = useMemo(
    () => generateCalendarDays(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const goToPreviousMonth = useCallback(() => {
    setViewMonth((prev) => {
      if (prev === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setViewMonth((prev) => {
      if (prev === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  const handleDateSelect = useCallback(
    async (day: number) => {
      const dateStr = formatDateISO(viewYear, viewMonth, day);

      try {
        setLoading(true);
        setError(null);
        const note = await orpc.notes.getOrCreateDailyNote({ date: dateStr });
        onClose();
        router.push(`/notes/${note.id}`);
      } catch (err) {
        console.error("Failed to create daily note:", err);
        setError(
          err instanceof Error ? err.message : "Failed to create daily note"
        );
      } finally {
        setLoading(false);
      }
    },
    [viewYear, viewMonth, onClose]
  );

  // Reset state when modal opens
  const handleShow = useCallback(() => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setError(null);
    setLoading(false);
  }, []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onShow={handleShow}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Daily Note</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              disabled={loading}
            >
              <X size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>Select a date</Text>

          {/* Month navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity
              onPress={goToPreviousMonth}
              style={styles.navButton}
              disabled={loading}
            >
              <ChevronLeft size={20} color={loading ? "#ccc" : "#007AFF"} />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity
              onPress={goToNextMonth}
              style={styles.navButton}
              disabled={loading}
            >
              <ChevronRight size={20} color={loading ? "#ccc" : "#007AFF"} />
            </TouchableOpacity>
          </View>

          {/* Weekday labels */}
          <View style={styles.weekdayRow}>
            {WEEKDAY_LABELS.map((label) => (
              <View key={label} style={styles.dayCell}>
                <Text style={styles.weekdayLabel}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <View key={`blank-${index}`} style={styles.dayCell} />;
              }

              const isToday = isSameDate(viewYear, viewMonth, day, today);

              return (
                <TouchableOpacity
                  key={`day-${day}`}
                  style={[styles.dayCell, styles.dayButton]}
                  onPress={() => handleDateSelect(day)}
                  disabled={loading}
                  activeOpacity={0.6}
                >
                  <View
                    style={[styles.dayCircle, isToday && styles.todayCircle]}
                  >
                    <Text
                      style={[styles.dayText, isToday && styles.todayText]}
                    >
                      {day}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Loading indicator */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Creating daily note...</Text>
            </View>
          )}

          {/* Error message */}
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 360,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  closeButton: {
    padding: 4,
    borderRadius: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
    marginTop: 4,
    marginBottom: 16,
  },
  monthNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  dayButton: {
    // Touchable area styling
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  todayCircle: {
    backgroundColor: "#007AFF",
  },
  weekdayLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#999",
    textAlign: "center",
  },
  dayText: {
    fontSize: 15,
    color: "#1a1a1a",
    textAlign: "center",
  },
  todayText: {
    color: "#fff",
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
});
