import { Redirect } from "expo-router";

export default function Index() {
  // TODO: Check authentication state and redirect accordingly
  // For now, always redirect to login
  return <Redirect href="/(auth)/login" />;
}
