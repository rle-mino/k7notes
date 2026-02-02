import { Redirect } from "expo-router";

export default function Index() {
  // Redirect to login - auth will handle routing to home if already logged in
  return <Redirect href="/(auth)/login" />;
}
