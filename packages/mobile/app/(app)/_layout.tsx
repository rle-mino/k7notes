import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Tabs, router } from "expo-router";
import { TabBar } from "@/components/navigation/TabBar";
import { AudioRecordingModal } from "@/components/audio/AudioRecordingModal";
import { authClient } from "@/lib/auth";
import { colors } from "@/theme";

type RecordType = "audio";

export default function AppLayout() {
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

  // Mobile uses bottom tabs
  return (
    <>
      <Tabs
        tabBar={(props) => <TabBar {...props} onRecord={handleRecord} />}
        screenOptions={{
          headerShown: true,
          headerTitleAlign: "center",
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
        }}
      >
        <Tabs.Screen
          name="notes/index"
          options={{
            title: "Notes",
          }}
        />
        <Tabs.Screen
          name="search/index"
          options={{
            title: "Search",
          }}
        />
        <Tabs.Screen
          name="recents/index"
          options={{
            title: "Recents",
          }}
        />
        <Tabs.Screen
          name="settings/index"
          options={{
            title: "Settings",
          }}
        />
        {/* Hidden screens - not shown in tab bar but accessible via navigation */}
        <Tabs.Screen
          name="notes/[id]"
          options={{
            href: null,
            title: "Edit Note",
          }}
        />
        <Tabs.Screen
          name="notes/folder/[id]"
          options={{
            href: null,
            title: "Folder",
          }}
        />
        <Tabs.Screen
          name="notes/new"
          options={{
            href: null,
            title: "New Note",
          }}
        />
        <Tabs.Screen
          name="home"
          options={{
            href: null,
          }}
        />
      </Tabs>

      <AudioRecordingModal
        visible={audioModalVisible}
        onClose={() => setAudioModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
});
