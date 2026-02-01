import React, { useCallback } from "react";
import { Tabs, router } from "expo-router";
import { TabBar } from "@/components/navigation/TabBar";

type RecordType = "audio" | "text";

export default function AppLayout() {
  const handleRecord = useCallback((type: RecordType) => {
    if (type === "text") {
      router.push("/notes/new");
    } else {
      // Audio recording - to be implemented
      console.log("Audio recording requested");
    }
  }, []);

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
