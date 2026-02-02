import { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Linking, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCalendarConnections } from "@/hooks/useCalendarConnections";
import type { CalendarProvider } from "@/lib/orpc";

const APP_SCHEME = "k7notes";

/**
 * Parse the provider from the OAuth state
 * State format: "provider:platform:uuid" (e.g., "google:mobile:abc-123-def")
 */
function parseProviderFromState(state: string | undefined): CalendarProvider | null {
  if (!state) return null;
  const parts = state.split(":");
  if (parts.length < 3) return null;
  const provider = parts[0];
  if (provider === "google" || provider === "microsoft") {
    return provider;
  }
  return null;
}

/**
 * Redirect to settings - uses deep link on web (to open the app),
 * or router.replace on native
 */
function navigateToSettings(router: ReturnType<typeof useRouter>) {
  if (Platform.OS === "web") {
    // On web, redirect to the mobile app using deep link
    const deepLink = `${APP_SCHEME}://settings`;
    Linking.openURL(deepLink).catch(() => {
      // If deep link fails, show a message (app might not be installed)
      console.warn("Could not open app via deep link");
    });
  } else {
    // On native, use router
    router.replace("/(app)/settings");
  }
}

/**
 * OAuth callback handler for calendar connections
 * This route handles deep links from the OAuth flow:
 * k7notes://calendar/callback?code=xxx&state=xxx
 *
 * Or web callback:
 * http://localhost:4001/calendar/callback?code=xxx&state=xxx
 *
 * The provider is encoded in the state parameter (format: "provider:uuid")
 */
export default function CalendarCallbackScreen() {
  const params = useLocalSearchParams<{
    code?: string;
    state?: string;
    error?: string;
  }>();
  const router = useRouter();
  const { handleOAuthCallback, clearPendingProvider } = useCalendarConnections();
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
          navigateToSettings(router);
        }, 2000);
        return;
      }

      if (!code) {
        setStatus("error");
        setErrorMessage("Missing authorization code");
        await clearPendingProvider();
        setTimeout(() => {
          navigateToSettings(router);
        }, 2000);
        return;
      }

      try {
        // Extract the provider from the state parameter
        const provider = parseProviderFromState(state);
        if (!provider) {
          throw new Error("Could not determine calendar provider from state. Please try again.");
        }

        await handleOAuthCallback(provider, code, state);
        await clearPendingProvider();
        setStatus("success");
        // Navigate to settings to see the new connection
        setTimeout(() => {
          navigateToSettings(router);
        }, 1500);
      } catch (err) {
        console.error("OAuth callback error:", err);
        await clearPendingProvider();
        setStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to connect calendar"
        );
        setTimeout(() => {
          navigateToSettings(router);
        }, 2000);
      }
    }

    processCallback();
  }, [params, handleOAuthCallback, clearPendingProvider, router]);

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
