import { Redirect } from "expo-router";

export default function Index() {
  // Redirect to app - the (app)/_layout auth guard will redirect to login if needed
  return <Redirect href="/(app)/notes" />;
}
