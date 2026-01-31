import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: "K7Notes",
        headerTitleAlign: "center",
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: "Sign In",
        }}
      />
    </Stack>
  );
}
