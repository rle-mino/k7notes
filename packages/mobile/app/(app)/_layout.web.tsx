import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { Stack, router } from "expo-router";
import { Sidebar } from "@/components/navigation/Sidebar";
import { AudioRecordingModal } from "@/components/audio/AudioRecordingModal";
import { authClient } from "@/lib/auth";

type RecordType = "audio";

export default function AppLayoutWeb() {
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
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <Sidebar onRecord={handleRecord} />
        <View style={styles.content}>
          <Stack
            screenOptions={{
              headerShown: true,
              headerTitleAlign: "center",
            }}
          >
            <Stack.Screen
              name="notes/index"
              options={{
                title: "Notes",
              }}
            />
            <Stack.Screen
              name="notes/[id]"
              options={{
                title: "Edit Note",
              }}
            />
            <Stack.Screen
              name="notes/folder/[id]"
              options={{
                title: "Folder",
              }}
            />
            <Stack.Screen
              name="notes/new"
              options={{
                title: "New Note",
              }}
            />
            <Stack.Screen
              name="search/index"
              options={{
                title: "Search",
              }}
            />
            <Stack.Screen
              name="recents/index"
              options={{
                title: "Recents",
              }}
            />
            <Stack.Screen
              name="settings/index"
              options={{
                title: "Settings",
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
});
