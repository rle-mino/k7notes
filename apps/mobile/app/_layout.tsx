import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useEffect } from "react";
import { authClient } from "@/lib/auth";

export default function RootLayout() {
  const { data: session, isPending } = authClient.useSession();

  // Handle navigation based on auth state
  useEffect(() => {
    if (isPending) return;

    if (session) {
      // User is authenticated, go to app
      router.replace("/(app)/home");
    } else {
      // User is not authenticated, go to login
      router.replace("/(auth)/login");
    }
  }, [session, isPending]);

  // Show loading while checking auth state
  if (isPending) {
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
