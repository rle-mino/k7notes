import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="login"
        options={{
          title: "Sign In",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          title: "Create Account",
          headerShown: true,
        }}
      />
    </Stack>
  );
}
