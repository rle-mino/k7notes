import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import { usePathname, router } from "expo-router";
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
import { SidebarItem } from "@/components/ui/SidebarItem";
import { HeroFAB } from "@/components/ui/HeroFAB";
import { colors, typography, spacing, radius, shadows, layout } from "@/theme";

type RecordType = "audio";

interface SidebarProps {
  onRecord: (type: RecordType) => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  label: string;
}

const MAIN_NAV: NavItem[] = [
  { name: "notes", path: "/notes", icon: FolderOpen, label: "Notes" },
  { name: "search", path: "/search", icon: Search, label: "Search" },
  { name: "recents", path: "/recents", icon: Clock, label: "Recents" },
];

export function Sidebar({ onRecord }: SidebarProps) {
  const pathname = usePathname();
  const [recordMenuVisible, setRecordMenuVisible] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);

  const handleNavPress = (path: string) => {
    router.push(path as "/" | "/notes" | "/search" | "/recents" | "/settings");
  };

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

  const isActive = (path: string) => {
    if (path === "/notes") {
      return pathname === "/notes" || pathname.startsWith("/notes/");
    }
    return pathname.startsWith(path);
  };

  return (
    <>
      <View style={styles.container}>
        {/* Logo */}
        <View style={styles.header}>
          <Text style={styles.logo}>K7Notes</Text>
        </View>

        {/* Main navigation */}
        <View style={styles.nav}>
          {MAIN_NAV.map((item) => (
            <SidebarItem
              key={item.name}
              icon={item.icon}
              label={item.label}
              active={isActive(item.path)}
              onPress={() => handleNavPress(item.path)}
            />
          ))}
        </View>

        {/* Bottom section: Settings + version */}
        <View style={styles.bottom}>
          <View style={styles.divider} />
          <SidebarItem
            icon={Settings}
            label="Settings"
            active={isActive("/settings")}
            onPress={() => handleNavPress("/settings")}
          />
          <Text style={styles.version}>K7Notes v0.0.1</Text>
        </View>
      </View>

      {/* Hero FAB — centered in the content area */}
      <View style={styles.fabWrapper} pointerEvents="box-none">
        <HeroFAB onPress={handleRecordPress} size={52} />
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
          <View style={styles.recordMenu}>
            <Text style={styles.recordMenuTitle}>Create New</Text>
            <TouchableOpacity
              style={styles.recordOption}
              onPress={() => handleRecordSelect("audio")}
              activeOpacity={0.7}
            >
              <View style={styles.recordOptionIcon}>
                <Mic size={28} color={colors.accent} strokeWidth={1.8} />
              </View>
              <View style={styles.recordOptionText}>
                <Text style={styles.recordOptionLabel}>Audio Note</Text>
                <Text style={styles.recordOptionDesc}>Record voice memo</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.recordOption}
              onPress={() => handleRecordSelect("text")}
              activeOpacity={0.7}
            >
              <View style={styles.recordOptionIcon}>
                <Pencil size={28} color={colors.accent} strokeWidth={1.8} />
              </View>
              <View style={styles.recordOptionText}>
                <Text style={styles.recordOptionLabel}>Text Note</Text>
                <Text style={styles.recordOptionDesc}>Write a new note</Text>
              </View>
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
    width: layout.sidebarWidth,
    backgroundColor: colors.sidebar,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  header: {
    marginBottom: spacing["3xl"],
    paddingHorizontal: spacing.md,
  },
  logo: {
    ...typography.h2,
    letterSpacing: -0.5,
  },
  nav: {
    flex: 1,
    gap: spacing.xs,
  },
  bottom: {
    gap: spacing.xs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  version: {
    ...typography.caption,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  fabWrapper: {
    position: "absolute",
    bottom: spacing["2xl"],
    left: layout.sidebarWidth,
    right: 0,
    alignItems: "center",
    zIndex: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  recordMenu: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: 320,
    ...shadows.lg,
  },
  recordMenuTitle: {
    ...typography.h2,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  recordOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.sm,
    gap: spacing.base,
  },
  recordOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  recordOptionText: {
    flex: 1,
  },
  recordOptionLabel: {
    ...typography.bodyMedium,
    marginBottom: 2,
  },
  recordOptionDesc: {
    ...typography.small,
  },
});
