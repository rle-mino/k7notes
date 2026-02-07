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
  type LucideIcon,
} from "lucide-react-native";
import { CreateNoteModal } from "@/components/notes/CreateNoteModal";
import { HeroFAB } from "@/components/ui/HeroFAB";
import { colors, typography, spacing, radius, shadows } from "@/theme";

type RecordType = "audio";

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
  const [noteModalVisible, setNoteModalVisible] = useState(false);

  const handleRecordPress = () => {
    setRecordMenuVisible(true);
  };

  const handleRecordSelect = (type: RecordType | "text") => {
    setRecordMenuVisible(false);
    if (type === "text") {
      setNoteModalVisible(true);
    } else {
      onRecord(type);
    }
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

  const renderTab = (route: (typeof state.routes)[0]) => {
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
              size={22}
              color={isFocused ? colors.accent : colors.textTertiary}
              strokeWidth={isFocused ? 2.2 : 1.8}
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
            {leftTabs.map((route) => renderTab(route))}
          </View>

          {/* Center Hero FAB */}
          <View style={styles.recordContainer}>
            <HeroFAB
              onPress={handleRecordPress}
              size={52}
              style={styles.heroFab}
            />
          </View>

          {/* Right tabs */}
          <View style={styles.tabGroup}>
            {rightTabs.map((route) => renderTab(route))}
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
                <Mic size={28} color={colors.accent} strokeWidth={1.8} />
              </View>
              <Text style={styles.recordOptionLabel}>Audio</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.recordOption}
              onPress={() => handleRecordSelect("text")}
              activeOpacity={0.7}
            >
              <View style={styles.recordOptionIcon}>
                <Pencil size={28} color={colors.accent} strokeWidth={1.8} />
              </View>
              <Text style={styles.recordOptionLabel}>Text</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <CreateNoteModal
        visible={noteModalVisible}
        folderId={null}
        onClose={() => setNoteModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  tabsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
  },
  tabGroup: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-around",
  },
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    minWidth: 64,
  },
  tabIconContainer: {
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: "500",
  },
  tabLabelActive: {
    color: colors.accent,
    fontWeight: "600",
  },
  recordContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: spacing.sm,
  },
  heroFab: {
    marginTop: -20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  recordMenu: {
    position: "absolute",
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.sm,
    gap: spacing.sm,
    ...shadows.lg,
  },
  recordOption: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    minWidth: 100,
  },
  recordOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  recordOptionLabel: {
    ...typography.label,
    fontWeight: "600",
    color: colors.textPrimary,
  },
});
