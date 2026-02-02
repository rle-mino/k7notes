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
  Plus,
  type LucideIcon,
} from "lucide-react-native";
import { CreateNoteModal } from "@/components/notes/CreateNoteModal";

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

const NAV_ITEMS: NavItem[] = [
  { name: "notes", path: "/notes", icon: FolderOpen, label: "Notes" },
  { name: "search", path: "/search", icon: Search, label: "Search" },
  { name: "recents", path: "/recents", icon: Clock, label: "Recents" },
  { name: "settings", path: "/settings", icon: Settings, label: "Settings" },
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
        <View style={styles.header}>
          <Text style={styles.logo}>K7Notes</Text>
        </View>

        <View style={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const IconComponent = item.icon;
            const active = isActive(item.path);
            return (
              <TouchableOpacity
                key={item.name}
                style={[styles.navItem, active && styles.navItemActive]}
                onPress={() => handleNavPress(item.path)}
                activeOpacity={0.7}
              >
                <IconComponent
                  size={20}
                  color={active ? "#007AFF" : "#666"}
                  strokeWidth={active ? 2.5 : 2}
                />
                <Text
                  style={[styles.navLabel, active && styles.navLabelActive]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
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
        <Plus size={32} color="#fff" strokeWidth={2} />
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
              <View style={styles.recordOptionIcon}>
                <Mic size={32} color="#007AFF" strokeWidth={2} />
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
                <Pencil size={32} color="#007AFF" strokeWidth={2} />
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
    alignItems: "center",
    justifyContent: "center",
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
