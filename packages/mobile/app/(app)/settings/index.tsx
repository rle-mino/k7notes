import React, { useState, useCallback } from "react";
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
import { useFocusEffect } from "@react-navigation/native";
import { authClient } from "@/lib/auth";
import {
  User,
  Mail,
  Palette,
  Bell,
  Cloud,
  Package,
  Info,
  FileText,
  ClipboardList,
  ChevronRight,
  Calendar,
  Plus,
  Settings2,
  type LucideIcon,
} from "lucide-react-native";
import { useCalendarConnections } from "@/hooks/useCalendarConnections";
import {
  ConnectCalendarModal,
  CalendarConnectionItem,
} from "@/components/calendar";
import { SettingsGroup } from "@/components/ui/SettingsGroup";
import { colors, typography, spacing, radius } from "@/theme";

interface SettingItemProps {
  icon: LucideIcon;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

function SettingItem({
  icon: IconComponent,
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
      <View style={styles.settingIcon}>
        <IconComponent
          size={18}
          color={destructive ? colors.error : colors.textSecondary}
          strokeWidth={1.8}
        />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingLabel, destructive && styles.settingLabelDestructive]}>
          {label}
        </Text>
        {value && <Text style={styles.settingValue}>{value}</Text>}
      </View>
      {onPress && (
        <ChevronRight size={16} color={colors.textTertiary} strokeWidth={1.8} />
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const session = authClient.useSession();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const {
    connections,
    loading: loadingCalendars,
    fetchConnections,
    getOAuthUrl,
    handleOAuthCallback,
    disconnect,
  } = useCalendarConnections();

  // Fetch calendar connections when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchConnections();
    }, [fetchConnections])
  );

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
      <SettingsGroup title="Account">
        <SettingItem
          icon={User}
          label="Name"
          value={session.data?.user?.name || "\u2014"}
        />
        <SettingItem
          icon={Mail}
          label="Email"
          value={session.data?.user?.email || "\u2014"}
        />
      </SettingsGroup>

      {/* Preferences Section */}
      <SettingsGroup title="Preferences">
        <SettingItem
          icon={Palette}
          label="Appearance"
          value="System"
          onPress={() => Alert.alert("Coming Soon", "Theme settings will be available in a future update.")}
        />
        <SettingItem
          icon={Bell}
          label="Notifications"
          value="On"
          onPress={() => Alert.alert("Coming Soon", "Notification settings will be available in a future update.")}
        />
      </SettingsGroup>

      {/* Calendar Section */}
      <SettingsGroup title="Calendars">
        {loadingCalendars && connections.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={styles.loadingText}>Loading calendars...</Text>
          </View>
        ) : connections.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Calendar size={28} color={colors.textTertiary} strokeWidth={1.5} />
            <Text style={styles.emptyText}>No calendars connected</Text>
            <Text style={styles.emptySubtext}>
              Connect your calendar to see events alongside your notes
            </Text>
          </View>
        ) : (
          connections.map((connection) => (
            <View key={connection.id}>
              <CalendarConnectionItem
                connection={connection}
                onDisconnect={disconnect}
                onPress={() => router.push(`/(app)/calendar/${connection.id}`)}
              />
              <TouchableOpacity
                style={styles.selectCalendarsButton}
                onPress={() => router.push(`/(app)/calendar/select/${connection.id}`)}
              >
                <Settings2 size={15} color={colors.accent} strokeWidth={1.8} />
                <Text style={styles.selectCalendarsText}>Select calendars</Text>
                <ChevronRight size={14} color={colors.textTertiary} strokeWidth={1.8} />
              </TouchableOpacity>
            </View>
          ))
        )}
        <TouchableOpacity
          style={styles.addCalendarButton}
          onPress={() => setShowConnectModal(true)}
        >
          <Plus size={18} color={colors.accent} strokeWidth={2} />
          <Text style={styles.addCalendarText}>Connect Calendar</Text>
        </TouchableOpacity>
      </SettingsGroup>

      {/* Storage Section */}
      <SettingsGroup title="Storage">
        <SettingItem
          icon={Cloud}
          label="Sync Status"
          value="Synced"
        />
        <SettingItem
          icon={Package}
          label="Clear Cache"
          onPress={() => Alert.alert("Coming Soon", "Cache clearing will be available in a future update.")}
        />
      </SettingsGroup>

      {/* About Section */}
      <SettingsGroup title="About">
        <SettingItem
          icon={Info}
          label="Version"
          value="0.0.1"
        />
        <SettingItem
          icon={FileText}
          label="Privacy Policy"
          onPress={() => Alert.alert("Coming Soon", "Privacy policy will be available soon.")}
        />
        <SettingItem
          icon={ClipboardList}
          label="Terms of Service"
          onPress={() => Alert.alert("Coming Soon", "Terms of service will be available soon.")}
        />
      </SettingsGroup>

      {/* Sign Out */}
      <View style={styles.signOutSection}>
        <TouchableOpacity
          style={[styles.signOutButton, loggingOut && styles.signOutButtonDisabled]}
          onPress={confirmLogout}
          disabled={loggingOut}
          activeOpacity={0.7}
        >
          {loggingOut ? (
            <ActivityIndicator color={colors.error} />
          ) : (
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with care for your notes</Text>
      </View>

      <ConnectCalendarModal
        visible={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onGetOAuthUrl={getOAuthUrl}
        onHandleCallback={handleOAuthCallback}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.base,
  },
  settingItemDisabled: {
    opacity: 0.4,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    ...typography.body,
  },
  settingLabelDestructive: {
    color: colors.error,
  },
  settingValue: {
    ...typography.small,
    color: colors.textTertiary,
    marginTop: 1,
  },
  signOutSection: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.base,
  },
  signOutButton: {
    backgroundColor: colors.errorLight,
    paddingVertical: spacing.base,
    borderRadius: radius.lg,
    alignItems: "center",
  },
  signOutButtonDisabled: {
    opacity: 0.5,
  },
  signOutButtonText: {
    ...typography.bodyMedium,
    color: colors.error,
  },
  footer: {
    padding: spacing["2xl"],
    alignItems: "center",
  },
  footerText: {
    ...typography.caption,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  emptySubtext: {
    ...typography.small,
    textAlign: "center",
  },
  addCalendarButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.base,
    gap: spacing.sm,
  },
  addCalendarText: {
    ...typography.bodyMedium,
    color: colors.accent,
  },
  selectCalendarsButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingLeft: 68,
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  selectCalendarsText: {
    flex: 1,
    ...typography.small,
    color: colors.accent,
    fontWeight: "500",
  },
});
