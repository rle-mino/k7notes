import React, { useCallback, useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Tabs, router } from "expo-router";
import { TabBar } from "@/components/navigation/TabBar";
import { authClient } from "@/lib/auth";

type RecordType = "audio";

export default function AppLayout() {
  const { data: session, isPending } = authClient.useSession();

  const handleRecord = useCallback((type: RecordType) => {
    // Audio recording - to be implemented
    console.log("Audio recording requested:", type);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace("/(auth)/login");
    }
  }, [isPending, session]);

  // Show loading while checking session
  if (isPending) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Don't render tabs if not authenticated (will redirect)
  if (!session?.user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Mobile uses bottom tabs
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} onRecord={handleRecord} />}
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "center",
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
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
});
