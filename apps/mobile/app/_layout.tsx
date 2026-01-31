import { Stack, router, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState, useRef } from "react";
import { View, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { initDatabase } from "../db";
import { authClient } from "@/lib/auth";

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const segments = useSegments();
  const hasNavigated = useRef(false);

  // Use auth session - wrap in try/catch for web compatibility
  const authState = Platform.OS === 'web' ? { data: null, isPending: false } : authClient.useSession();
  const session = authState.data;
  const isPending = authState.isPending;

  // Initialize database on app start
  useEffect(() => {
    initDatabase()
      .then(() => setDbReady(true))
      .catch((err) => console.error('[DB] Migration failed:', err));
  }, []);

  // Mark auth as checked once isPending becomes false
  useEffect(() => {
    if (!isPending && !authChecked) {
      setAuthChecked(true);
    }
  }, [isPending, authChecked]);

  // Handle navigation based on auth state - only run once when ready
  const firstSegment = segments[0];

  useEffect(() => {
    if (!authChecked || !dbReady || hasNavigated.current) return;

    const inAuthGroup = firstSegment === "(auth)";
    const inAppGroup = firstSegment === "(app)";

    if (session && !inAppGroup) {
      hasNavigated.current = true;
      router.replace("/(app)/home");
    } else if (!session && !inAuthGroup) {
      hasNavigated.current = true;
      router.replace("/(auth)/login");
    }
  }, [session, authChecked, dbReady, firstSegment]);

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
