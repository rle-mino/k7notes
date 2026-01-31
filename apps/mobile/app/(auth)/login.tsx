import { StyleSheet, Text, View, Pressable } from "react-native";
import { router } from "expo-router";

export default function LoginScreen() {
  const handleLogin = () => {
    // TODO: Implement actual authentication with better-auth
    // For now, navigate to home
    router.replace("/(app)/home");
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to K7Notes</Text>
        <Text style={styles.subtitle}>
          Seamless meeting capture with AI-powered transcription
        </Text>

        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>API Status:</Text>
          <Text style={styles.statusText}>Checking...</Text>
        </View>

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
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: "#666",
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: "#888",
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
