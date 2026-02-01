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

type RecordType = "audio" | "text";

interface SidebarProps {
  onRecord: (type: RecordType) => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: "notes", path: "/notes", icon: "📁", label: "Notes" },
  { name: "search", path: "/search", icon: "🔍", label: "Search" },
  { name: "recents", path: "/recents", icon: "🕐", label: "Recents" },
  { name: "settings", path: "/settings", icon: "⚙️", label: "Settings" },
];

export function Sidebar({ onRecord }: SidebarProps) {
  const pathname = usePathname();
  const [recordMenuVisible, setRecordMenuVisible] = useState(false);

  const handleNavPress = (path: string) => {
    router.push(path as "/" | "/notes" | "/search" | "/recents" | "/settings");
  };

  const handleRecordPress = () => {
    setRecordMenuVisible(true);
  };

  const handleRecordSelect = (type: RecordType) => {
    setRecordMenuVisible(false);
    onRecord(type);
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
        <View style={styles.header}>
          <Text style={styles.logo}>K7Notes</Text>
        </View>

        <View style={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.name}
              style={[styles.navItem, isActive(item.path) && styles.navItemActive]}
              onPress={() => handleNavPress(item.path)}
              activeOpacity={0.7}
            >
              <Text style={styles.navIcon}>{item.icon}</Text>
              <Text
                style={[styles.navLabel, isActive(item.path) && styles.navLabelActive]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>K7Notes v0.0.1</Text>
        </View>
      </View>

      {/* Floating record button */}
      <TouchableOpacity
        style={styles.floatingRecordButton}
        onPress={handleRecordPress}
        activeOpacity={0.8}
      >
        <Text style={styles.floatingRecordIcon}>+</Text>
      </TouchableOpacity>

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
              <Text style={styles.recordOptionIcon}>🎤</Text>
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
              <Text style={styles.recordOptionIcon}>✏️</Text>
              <View style={styles.recordOptionText}>
                <Text style={styles.recordOptionLabel}>Text Note</Text>
                <Text style={styles.recordOptionDesc}>Write a new note</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 240,
    backgroundColor: "#fafafa",
    borderRightWidth: 1,
    borderRightColor: "#eee",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  logo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  nav: {
    flex: 1,
    gap: 4,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 12,
  },
  navItemActive: {
    backgroundColor: "#e8f4ff",
  },
  navIcon: {
    fontSize: 20,
  },
  navLabel: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
  navLabelActive: {
    color: "#007AFF",
    fontWeight: "600",
  },
  footer: {
    paddingHorizontal: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    marginTop: 16,
  },
  footerText: {
    fontSize: 12,
    color: "#999",
  },
  floatingRecordButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
  floatingRecordIcon: {
    fontSize: 36,
    color: "#fff",
    fontWeight: "300",
    marginTop: -2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  recordMenu: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  recordMenuTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 20,
    textAlign: "center",
  },
  recordOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 16,
  },
  recordOptionIcon: {
    fontSize: 32,
  },
  recordOptionText: {
    flex: 1,
  },
  recordOptionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  recordOptionDesc: {
    fontSize: 13,
    color: "#666",
  },
});
