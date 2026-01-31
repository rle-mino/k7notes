import { Stack, router, useSegments, useRootNavigationState } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { initDatabase } from "../db";

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  const navigationState = useRootNavigationState();

  // Initialize database on app start - only once
  useEffect(() => {
    let mounted = true;
    initDatabase()
      .then(() => {
        if (mounted) {
          setDbReady(true);
          // For now, always go to login - auth will be handled there
          setInitialRoute("/(auth)/login");
        }
      })
      .catch((err) => console.error('[DB] Migration failed:', err));
    return () => { mounted = false; };
  }, []);

  // Navigate once when ready
  useEffect(() => {
    if (!dbReady || !initialRoute || !navigationState?.key) return;
    router.replace(initialRoute as any);
  }, [dbReady, initialRoute, navigationState?.key]);

  // Show loading while waiting for database
  if (!dbReady) {
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
