import { useEffect, useState } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import { checkHealth, getApiUrl } from "@/lib/api";

type ConnectionStatus = "checking" | "connected" | "disconnected";

export default function LoginScreen() {
  const [status, setStatus] = useState<ConnectionStatus>("checking");
  const [apiUrl, setApiUrl] = useState<string>("");

  useEffect(() => {
    setApiUrl(getApiUrl());
    checkApiConnection();
  }, []);

  const checkApiConnection = async () => {
    setStatus("checking");
    const result = await checkHealth();
    setStatus(result.data ? "connected" : "disconnected");
  };

  const handleLogin = () => {
    // TODO: Implement actual authentication with better-auth
    // For now, navigate to home
    router.replace("/(app)/home");
  };

  const getStatusColor = () => {
    switch (status) {
      case "connected":
        return "#34C759";
      case "disconnected":
        return "#FF3B30";
      default:
        return "#888";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "connected":
        return "Connected";
      case "disconnected":
        return "Disconnected";
      default:
        return "Checking...";
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to K7Notes</Text>
        <Text style={styles.subtitle}>
          Seamless meeting capture with AI-powered transcription
        </Text>

        <Pressable style={styles.statusContainer} onPress={checkApiConnection}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>API Status:</Text>
            <View
              style={[styles.statusDot, { backgroundColor: getStatusColor() }]}
            />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
          <Text style={styles.apiUrl}>{apiUrl}</Text>
          <Text style={styles.tapHint}>Tap to refresh</Text>
        </Pressable>

        <Pressable style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Sign In</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 48,
    maxWidth: 280,
  },
  statusContainer: {
    alignItems: "center",
    marginBottom: 32,
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    minWidth: 240,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 14,
    color: "#666",
    marginRight: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  apiUrl: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  tapHint: {
    fontSize: 10,
    color: "#bbb",
    marginTop: 8,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
});
