import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { authClient } from "@/lib/auth";

interface SettingItemProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

function SettingItem({
  icon,
  label,
  value,
  onPress,
  destructive,
  disabled,
}: SettingItemProps) {
  return (
    <TouchableOpacity
      style={[styles.settingItem, disabled && styles.settingItemDisabled]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={disabled || !onPress}
    >
      <Text style={styles.settingIcon}>{icon}</Text>
      <View style={styles.settingContent}>
        <Text style={[styles.settingLabel, destructive && styles.settingLabelDestructive]}>
          {label}
        </Text>
        {value && <Text style={styles.settingValue}>{value}</Text>}
      </View>
      {onPress && <Text style={styles.settingChevron}>›</Text>}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const session = authClient.useSession();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await authClient.signOut();
      // Navigate to auth after sign out
      router.replace("/(auth)/login");
    } catch (err) {
      Alert.alert("Error", "Could not sign out. Please try again.");
      setLoggingOut(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: handleLogout },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.sectionContent}>
          <SettingItem
            icon="👤"
            label="Name"
            value={session.data?.user?.name || "—"}
          />
          <SettingItem
            icon="✉️"
            label="Email"
            value={session.data?.user?.email || "—"}
          />
        </View>
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.sectionContent}>
          <SettingItem
            icon="🎨"
            label="Appearance"
            value="System"
            onPress={() => Alert.alert("Coming Soon", "Theme settings will be available in a future update.")}
          />
          <SettingItem
            icon="🔔"
            label="Notifications"
            value="On"
            onPress={() => Alert.alert("Coming Soon", "Notification settings will be available in a future update.")}
          />
        </View>
      </View>

      {/* Storage Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage</Text>
        <View style={styles.sectionContent}>
          <SettingItem
            icon="☁️"
            label="Sync Status"
            value="Synced"
          />
          <SettingItem
            icon="📦"
            label="Clear Cache"
            onPress={() => Alert.alert("Coming Soon", "Cache clearing will be available in a future update.")}
          />
        </View>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.sectionContent}>
          <SettingItem
            icon="ℹ️"
            label="Version"
            value="0.0.1"
          />
          <SettingItem
            icon="📄"
            label="Privacy Policy"
            onPress={() => Alert.alert("Coming Soon", "Privacy policy will be available soon.")}
          />
          <SettingItem
            icon="📋"
            label="Terms of Service"
            onPress={() => Alert.alert("Coming Soon", "Terms of service will be available soon.")}
          />
        </View>
      </View>

      {/* Sign Out */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.signOutButton, loggingOut && styles.signOutButtonDisabled]}
          onPress={confirmLogout}
          disabled={loggingOut}
          activeOpacity={0.7}
        >
          {loggingOut ? (
            <ActivityIndicator color="#FF3B30" />
          ) : (
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with care for your notes</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingItemDisabled: {
    opacity: 0.5,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: "#1a1a1a",
  },
  settingLabelDestructive: {
    color: "#FF3B30",
  },
  settingValue: {
    fontSize: 14,
    color: "#999",
    marginTop: 2,
  },
  settingChevron: {
    fontSize: 20,
    color: "#ccc",
    marginLeft: 8,
  },
  signOutButton: {
    backgroundColor: "#FEE2E2",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  signOutButtonDisabled: {
    opacity: 0.6,
  },
  signOutButtonText: {
    color: "#FF3B30",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    padding: 32,
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    color: "#999",
  },
});
