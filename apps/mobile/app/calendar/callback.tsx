import { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCalendarConnections } from "@/hooks/useCalendarConnections";

/**
 * OAuth callback handler for calendar connections
 * This route handles deep links from the OAuth flow:
 * k7notes://calendar/callback?code=xxx&state=xxx
 *
 * Or web callback:
 * http://localhost:4001/calendar/callback?code=xxx&state=xxx
 */
export default function CalendarCallbackScreen() {
  const params = useLocalSearchParams<{
    code?: string;
    state?: string;
    error?: string;
  }>();
  const router = useRouter();
  const { handleOAuthCallback, getPendingProvider, clearPendingProvider } = useCalendarConnections();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    async function processCallback() {
      // Prevent double processing
      if (processedRef.current) return;
      processedRef.current = true;

      const { code, state, error } = params;

      // Handle OAuth errors
      if (error) {
        setStatus("error");
        setErrorMessage(error);
        await clearPendingProvider();
        // Navigate back to settings after delay
        setTimeout(() => {
          router.replace("/(app)/settings");
        }, 2000);
        return;
      }

      if (!code) {
        setStatus("error");
        setErrorMessage("Missing authorization code");
        await clearPendingProvider();
        setTimeout(() => {
          router.replace("/(app)/settings");
        }, 2000);
        return;
      }

      try {
        // Get the provider that initiated the OAuth flow
        const provider = await getPendingProvider();
        if (!provider) {
          throw new Error("Could not determine calendar provider. Please try again.");
        }

        await handleOAuthCallback(provider, code, state);
        await clearPendingProvider();
        setStatus("success");
        // Navigate to settings to see the new connection
        setTimeout(() => {
          router.replace("/(app)/settings");
        }, 1500);
      } catch (err) {
        console.error("OAuth callback error:", err);
        await clearPendingProvider();
        setStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to connect calendar"
        );
        setTimeout(() => {
          router.replace("/(app)/settings");
        }, 2000);
      }
    }

    processCallback();
  }, [params, handleOAuthCallback, getPendingProvider, clearPendingProvider, router]);

  return (
    <View style={styles.container}>
      {status === "loading" && (
        <>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.text}>Connecting your calendar...</Text>
        </>
      )}
      {status === "success" && (
        <>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.text}>Calendar connected!</Text>
          <Text style={styles.subtext}>Redirecting...</Text>
        </>
      )}
      {status === "error" && (
        <>
          <Text style={styles.errorIcon}>✗</Text>
          <Text style={styles.errorText}>Connection failed</Text>
          <Text style={styles.subtext}>{errorMessage}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  text: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    marginTop: 16,
  },
  subtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  successIcon: {
    fontSize: 48,
    color: "#34C759",
  },
  errorIcon: {
    fontSize: 48,
    color: "#FF3B30",
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FF3B30",
    marginTop: 16,
  },
});
