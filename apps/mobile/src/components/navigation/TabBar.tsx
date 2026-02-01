import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import {
  FolderOpen,
  Search,
  Clock,
  Settings,
  Mic,
  Pencil,
  Plus,
  type LucideIcon,
} from "lucide-react-native";

type RecordType = "audio" | "text";

interface TabBarProps extends BottomTabBarProps {
  onRecord: (type: RecordType) => void;
}

const TAB_ICONS: Record<string, LucideIcon> = {
  "notes/index": FolderOpen,
  "search/index": Search,
  "recents/index": Clock,
  "settings/index": Settings,
};

const TAB_LABELS: Record<string, string> = {
  "notes/index": "Notes",
  "search/index": "Search",
  "recents/index": "Recents",
  "settings/index": "Settings",
};

export function TabBar({ state, descriptors, navigation, onRecord }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const [recordMenuVisible, setRecordMenuVisible] = useState(false);

  const handleRecordPress = () => {
    setRecordMenuVisible(true);
  };

  const handleRecordSelect = (type: RecordType) => {
    setRecordMenuVisible(false);
    onRecord(type);
  };

  // Filter out non-tab routes (like [id] routes)
  const tabRoutes = state.routes.filter(
    (route) =>
      route.name === "notes/index" ||
      route.name === "search/index" ||
      route.name === "recents/index" ||
      route.name === "settings/index"
  );

  // Split tabs for left and right of record button
  const leftTabs = tabRoutes.slice(0, 2);
  const rightTabs = tabRoutes.slice(2, 4);

  const renderTab = (route: (typeof state.routes)[0], _index: number) => {
    const { options } = descriptors[route.key];
    const isFocused = state.index === state.routes.findIndex((r) => r.key === route.key);

    const onPress = () => {
      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    const onLongPress = () => {
      navigation.emit({
        type: "tabLongPress",
        target: route.key,
      });
    };

    const IconComponent = TAB_ICONS[route.name];

    return (
      <TouchableOpacity
        key={route.key}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel}
        testID={options.tabBarButtonTestID}
        onPress={onPress}
        onLongPress={onLongPress}
        style={styles.tabButton}
        activeOpacity={0.7}
      >
        <View style={styles.tabIconContainer}>
          {IconComponent && (
            <IconComponent
              size={24}
              color={isFocused ? "#007AFF" : "#999"}
              strokeWidth={isFocused ? 2.5 : 2}
            />
          )}
        </View>
        <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
          {TAB_LABELS[route.name]}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <View style={styles.tabsContainer}>
          {/* Left tabs */}
          <View style={styles.tabGroup}>
            {leftTabs.map((route, index) => renderTab(route, index))}
          </View>

          {/* Center record button */}
          <View style={styles.recordContainer}>
            <TouchableOpacity
              style={styles.recordButton}
              onPress={handleRecordPress}
              activeOpacity={0.8}
            >
              <Plus size={32} color="#fff" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Right tabs */}
          <View style={styles.tabGroup}>
            {rightTabs.map((route, index) => renderTab(route, index + 2))}
          </View>
        </View>
      </View>

      {/* Record type selection modal */}
      <Modal
        visible={recordMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRecordMenuVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setRecordMenuVisible(false)}
        >
          <View style={[styles.recordMenu, { bottom: 100 + insets.bottom }]}>
            <TouchableOpacity
              style={styles.recordOption}
              onPress={() => handleRecordSelect("audio")}
              activeOpacity={0.7}
            >
              <View style={styles.recordOptionIcon}>
                <Mic size={32} color="#007AFF" strokeWidth={2} />
              </View>
              <Text style={styles.recordOptionLabel}>Audio</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.recordOption}
              onPress={() => handleRecordSelect("text")}
              activeOpacity={0.7}
            >
              <View style={styles.recordOptionIcon}>
                <Pencil size={32} color="#007AFF" strokeWidth={2} />
              </View>
              <Text style={styles.recordOptionLabel}>Text</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 8,
  },
  tabsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  tabGroup: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-around",
  },
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 12,
    minWidth: 64,
  },
  tabIconContainer: {
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
    color: "#999",
    fontWeight: "500",
  },
  tabLabelActive: {
    color: "#007AFF",
    fontWeight: "600",
  },
  recordContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
  },
  recordButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginTop: -20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  recordMenu: {
    position: "absolute",
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 8,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  recordOption: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    minWidth: 100,
  },
  recordOptionIcon: {
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  recordOptionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
  },
});
