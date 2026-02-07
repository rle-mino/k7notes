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
import { useTranslation } from "react-i18next";
import { authClient } from "@/lib/auth";
import {
  User,
  Mail,
  Palette,
  Bell,
  Globe,
  Languages,
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
import { usePreferences } from "@/hooks/usePreferences";
import {
  ConnectCalendarModal,
  CalendarConnectionItem,
} from "@/components/calendar";
import { LanguagePicker } from "@/components/settings/LanguagePicker";
import { SettingsGroup } from "@/components/ui/SettingsGroup";
import { colors, typography, spacing, radius, layout } from "@/theme";
import type { SupportedLanguage } from "@k7notes/contracts";

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
  const { t } = useTranslation();
  const session = authClient.useSession();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [langPickerVisible, setLangPickerVisible] = useState(false);
  const [transLangPickerVisible, setTransLangPickerVisible] = useState(false);
  const { appLanguage, transcriptionLanguage, updateAppLanguage, updateTranscriptionLanguage } = usePreferences();

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
      Alert.alert(t("common.error"), t("settings.signOutError"));
      setLoggingOut(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert(t("settings.signOut"), t("settings.signOutConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("settings.signOut"), style: "destructive", onPress: handleLogout },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Account Section */}
      <SettingsGroup title={t("settings.account")}>
        <SettingItem
          icon={User}
          label={t("settings.name")}
          value={session.data?.user?.name || "\u2014"}
        />
        <SettingItem
          icon={Mail}
          label={t("settings.email")}
          value={session.data?.user?.email || "\u2014"}
        />
      </SettingsGroup>

      {/* Preferences Section */}
      <SettingsGroup title={t("settings.preferences")}>
        <SettingItem
          icon={Palette}
          label={t("settings.appearance")}
          value={t("settings.appearanceSystem")}
          onPress={() => Alert.alert(t("settings.comingSoon"), t("settings.comingSoonTheme"))}
        />
        <SettingItem
          icon={Bell}
          label={t("settings.notifications")}
          value={t("settings.notificationsOn")}
          onPress={() => Alert.alert(t("settings.comingSoon"), t("settings.comingSoonNotifications"))}
        />
        <SettingItem
          icon={Globe}
          label={t("settings.language")}
          value={t(`languages.${appLanguage}`)}
          onPress={() => setLangPickerVisible(true)}
        />
        <SettingItem
          icon={Languages}
          label={t("settings.transcriptionLanguage")}
          value={transcriptionLanguage ? t(`languages.${transcriptionLanguage}`) : `${t("settings.useAppLanguage")} (${t(`languages.${appLanguage}`)})`}
          onPress={() => setTransLangPickerVisible(true)}
        />
      </SettingsGroup>

      {/* Calendar Section */}
      <SettingsGroup title={t("settings.calendars")}>
        {loadingCalendars && connections.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={styles.loadingText}>{t("settings.loadingCalendars")}</Text>
          </View>
        ) : connections.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Calendar size={28} color={colors.textTertiary} strokeWidth={1.5} />
            <Text style={styles.emptyText}>{t("settings.noCalendars")}</Text>
            <Text style={styles.emptySubtext}>
              {t("settings.noCalendarsHint")}
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
                <Text style={styles.selectCalendarsText}>{t("settings.selectCalendars")}</Text>
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
          <Text style={styles.addCalendarText}>{t("settings.connectCalendar")}</Text>
        </TouchableOpacity>
      </SettingsGroup>

      {/* Storage Section */}
      <SettingsGroup title={t("settings.storage")}>
        <SettingItem
          icon={Cloud}
          label={t("settings.syncStatus")}
          value={t("settings.synced")}
        />
        <SettingItem
          icon={Package}
          label={t("settings.clearCache")}
          onPress={() => Alert.alert(t("settings.comingSoon"), t("settings.comingSoonCache"))}
        />
      </SettingsGroup>

      {/* About Section */}
      <SettingsGroup title={t("settings.about")}>
        <SettingItem
          icon={Info}
          label={t("settings.version")}
          value="0.0.1"
        />
        <SettingItem
          icon={FileText}
          label={t("settings.privacyPolicy")}
          onPress={() => Alert.alert(t("settings.comingSoon"), t("settings.comingSoonPrivacy"))}
        />
        <SettingItem
          icon={ClipboardList}
          label={t("settings.termsOfService")}
          onPress={() => Alert.alert(t("settings.comingSoon"), t("settings.comingSoonTerms"))}
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
            <Text style={styles.signOutButtonText}>{t("settings.signOut")}</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t("settings.footer")}</Text>
      </View>

      <ConnectCalendarModal
        visible={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onGetOAuthUrl={getOAuthUrl}
        onHandleCallback={handleOAuthCallback}
      />

      <LanguagePicker
        visible={langPickerVisible}
        onClose={() => setLangPickerVisible(false)}
        title={t("settings.language")}
        currentValue={appLanguage}
        onSelect={(val) => { updateAppLanguage(val as SupportedLanguage); setLangPickerVisible(false); }}
      />
      <LanguagePicker
        visible={transLangPickerVisible}
        onClose={() => setTransLangPickerVisible(false)}
        title={t("settings.transcriptionLanguage")}
        currentValue={transcriptionLanguage}
        onSelect={(val) => { updateTranscriptionLanguage(val as SupportedLanguage | null); setTransLangPickerVisible(false); }}
        showUseAppLanguage
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: layout.bottomPadding,
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
