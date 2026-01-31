import { Stack, router, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { initDatabase } from "../db";
import { authClient } from "@/lib/auth";

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const segments = useSegments();

  // Use auth session - may fail on web due to SecureStore
  let session = null;
  let isPending = true;

  try {
    const authState = authClient.useSession();
    session = authState.data;
    isPending = authState.isPending;
  } catch (e) {
    // Auth may fail on web - that's ok, just skip auth check
    console.log('[Auth] Session hook failed (expected on web):', e);
    isPending = false;
  }

  // Stable auth state for dependency tracking
  const isAuthenticated = !!session;

  // Initialize database on app start
  useEffect(() => {
    initDatabase()
      .then(() => setDbReady(true))
      .catch((err) => console.error('[DB] Migration failed:', err));
  }, []);

  // Handle navigation based on auth state
  // Use first segment as stable dependency (segments array reference changes each render)
  const firstSegment = segments[0];

  useEffect(() => {
    if (isPending || !dbReady) return;

    const inAuthGroup = firstSegment === "(auth)";
    const inAppGroup = firstSegment === "(app)";

    if (isAuthenticated && !inAppGroup) {
      // User is signed in but not in app group - redirect to home
      router.replace("/(app)/home");
    } else if (!isAuthenticated && !inAuthGroup) {
      // User is not signed in and not in auth group - redirect to login
      router.replace("/(auth)/login");
    }
  }, [isAuthenticated, isPending, dbReady, firstSegment]);

  // Show loading while checking auth state or waiting for database
  if (!dbReady || isPending) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
