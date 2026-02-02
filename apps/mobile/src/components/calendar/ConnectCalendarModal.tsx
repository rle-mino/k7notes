import React, { useState, useCallback, useEffect } from "react";
import {
  StyleSheet,
  View,
  Modal,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { ORPCError } from "@orpc/client";
import { Calendar } from "lucide-react-native";
import type { CalendarProvider, CalendarConnection } from "@/lib/orpc";
import { CALENDAR_CALLBACK_URL } from "@/constants/app";

interface ConnectCalendarModalProps {
  visible: boolean;
  onClose: () => void;
  onGetOAuthUrl: (
    provider: CalendarProvider
  ) => Promise<{ url: string; state: string }>;
  onHandleCallback: (
    provider: CalendarProvider,
    code: string,
    state?: string
  ) => Promise<CalendarConnection>;
}

const PROVIDERS: { id: CalendarProvider; name: string; color: string }[] = [
  { id: "google", name: "Google Calendar", color: "#4285F4" },
  { id: "microsoft", name: "Microsoft Outlook", color: "#0078D4" },
];

/**
 * Extract a user-friendly error message from an API error
 */
function getErrorMessage(err: unknown): string {
  if (err instanceof ORPCError) {
    return err.message || `Error: ${err.code}`;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "Failed to connect calendar";
}

/**
 * Parse callback URL to extract code and state parameters
 */
function parseCallbackUrl(url: string): { code?: string; state?: string; error?: string } {
  try {
    // Handle both http URLs and custom scheme URLs
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    return {
      code: params.get("code") || undefined,
      state: params.get("state") || undefined,
      error: params.get("error") || undefined,
    };
  } catch {
    return {};
  }
}

export function ConnectCalendarModal({
  visible,
  onClose,
  onGetOAuthUrl,
  onHandleCallback,
}: ConnectCalendarModalProps) {
  const [connecting, setConnecting] = useState<CalendarProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setConnecting(null);
      setError(null);
    }
  }, [visible]);

  const handleConnect = useCallback(
    async (provider: CalendarProvider) => {
      try {
        setConnecting(provider);
        setError(null);

        const { url } = await onGetOAuthUrl(provider);

        if (Platform.OS === "web") {
          // On web, navigate in the same window (not a new tab)
          window.location.href = url;
          return;
        }

        // On native, use in-app browser that returns the result
        // The redirect URL should be our app's deep link scheme
        const result = await WebBrowser.openAuthSessionAsync(url, CALENDAR_CALLBACK_URL);

        if (result.type === "success" && result.url) {
          // Parse the callback URL
          const { code, state, error: oauthError } = parseCallbackUrl(result.url);

          if (oauthError) {
            setError(oauthError);
            return;
          }

          if (!code) {
            setError("Missing authorization code");
            return;
          }

          // Complete the OAuth flow
          await onHandleCallback(provider, code, state);
          onClose();
        } else if (result.type === "cancel") {
          // User cancelled - just close, no error
          setConnecting(null);
        }
      } catch (err) {
        console.error("Failed to connect calendar:", err);
        setError(getErrorMessage(err));
      } finally {
        setConnecting(null);
      }
    },
    [onGetOAuthUrl, onHandleCallback, onClose]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Calendar size={28} color="#007AFF" />
            <Text style={styles.title}>Connect Calendar</Text>
          </View>

          <Text style={styles.subtitle}>
            Choose a calendar provider to connect
          </Text>

          <View style={styles.providers}>
            {PROVIDERS.map((provider) => (
              <TouchableOpacity
                key={provider.id}
                style={[
                  styles.providerButton,
                  { borderColor: provider.color },
                ]}
                onPress={() => handleConnect(provider.id)}
                disabled={connecting !== null}
              >
                {connecting === provider.id ? (
                  <ActivityIndicator size="small" color={provider.color} />
                ) : (
                  <Text
                    style={[styles.providerText, { color: provider.color }]}
                  >
                    {provider.name}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={connecting !== null}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 340,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  providers: {
    gap: 12,
  },
  providerButton: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  providerText: {
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    marginTop: 16,
    textAlign: "center",
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
});
