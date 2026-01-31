import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: "K7Notes",
        headerTitleAlign: "center",
      }}
    >
      <Stack.Screen
        name="home"
        options={{
          title: "Home",
        }}
      />
    </Stack>
  );
}
