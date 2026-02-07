import "@/i18n";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { Stack, router } from "expo-router";
import { Sidebar } from "@/components/navigation/Sidebar";
import { AudioRecordingModal } from "@/components/audio/AudioRecordingModal";
import { useTranslation } from "react-i18next";
import { PreferencesProvider } from "@/hooks/usePreferences";
import { authClient } from "@/lib/auth";
import { colors } from "@/theme";

type RecordType = "audio";

export default function AppLayoutWeb() {
  const { t } = useTranslation();
  const { data: session, isPending } = authClient.useSession();
  const [audioModalVisible, setAudioModalVisible] = useState(false);
  // Track whether we've ever confirmed a valid session to avoid
  // false redirects when the auth atom resets on HMR/refresh.
  const hadSession = useRef(false);

  if (session?.user) {
    hadSession.current = true;
  }

  const handleRecord = useCallback((type: RecordType) => {
    if (type === "audio") {
      setAudioModalVisible(true);
    }
  }, []);

  // Redirect to login when the server confirms no valid session,
  // but only if we never had a session (avoids HMR false redirects).
  useEffect(() => {
    if (!isPending && !session?.user && !hadSession.current) {
      router.replace("/(auth)/login");
    }
  }, [isPending, session]);

  // Show loading while session check is in progress
  if (isPending || (!session?.user && hadSession.current)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <PreferencesProvider>
      <View style={styles.container}>
        <Sidebar onRecord={handleRecord} />
        <View style={styles.content}>
          <Stack
            screenOptions={{
              headerShown: true,
              headerTitleAlign: "center",
              headerStyle: {
                backgroundColor: colors.background,
              },
              headerTintColor: colors.textPrimary,
              headerShadowVisible: false,
              contentStyle: {
                backgroundColor: colors.background,
              },
            }}
          >
            <Stack.Screen
              name="notes/index"
              options={{
                title: t("tabs.notes"),
              }}
            />
            <Stack.Screen
              name="notes/[id]"
              options={{
                title: t("notes.editNote"),
              }}
            />
            <Stack.Screen
              name="notes/folder/[id]"
              options={{
                title: t("notes.folder"),
              }}
            />
            <Stack.Screen
              name="notes/new"
              options={{
                title: t("notes.newNote"),
              }}
            />
            <Stack.Screen
              name="search/index"
              options={{
                title: t("tabs.search"),
              }}
            />
            <Stack.Screen
              name="recents/index"
              options={{
                title: t("tabs.recents"),
              }}
            />
            <Stack.Screen
              name="settings/index"
              options={{
                title: t("tabs.settings"),
              }}
            />
            <Stack.Screen
              name="home"
              options={{
                headerShown: false,
              }}
            />
          </Stack>
        </View>
      </View>

      <AudioRecordingModal
        visible={audioModalVisible}
        onClose={() => setAudioModalVisible(false)}
      />
    </PreferencesProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
});
