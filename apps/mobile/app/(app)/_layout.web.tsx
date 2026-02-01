import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { Stack, router } from "expo-router";
import { Sidebar } from "@/components/navigation/Sidebar";

type RecordType = "audio" | "text";

export default function AppLayoutWeb() {
  const handleRecord = useCallback((type: RecordType) => {
    if (type === "text") {
      router.push("/notes/new");
    } else {
      // Audio recording - to be implemented
      console.log("Audio recording requested");
    }
  }, []);

  return (
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
});
