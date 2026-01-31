import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { authClient } from "@/lib/auth";

export default function HomeScreen() {
  const { data: session } = authClient.useSession();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await authClient.signOut();
      // Session clears automatically, _layout.tsx will redirect to auth
    } catch (err) {
      Alert.alert("Error", "Could not sign out. Please try again.");
      setLoggingOut(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: handleLogout },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>K7Notes</Text>

        {session?.user && (
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{session.user.name}</Text>
            <Text style={styles.userEmail}>{session.user.email}</Text>
          </View>
        )}

        <Text style={styles.subtitle}>Your meeting notes will appear here</Text>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>No meetings yet</Text>
          <Text style={styles.placeholderHint}>
            Note-taking features coming in Phase 2
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.logoutButton, loggingOut && styles.buttonDisabled]}
          onPress={confirmLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator color="#FF3B30" />
          ) : (
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          )}
        </TouchableOpacity>
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
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  userInfo: {
    marginBottom: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  placeholderText: {
    fontSize: 18,
    color: "#999",
    marginBottom: 8,
  },
  placeholderHint: {
    fontSize: 14,
    color: "#bbb",
    textAlign: "center",
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  logoutButton: {
    backgroundColor: "#FEE2E2",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  logoutButtonText: {
    color: "#FF3B30",
    fontSize: 16,
    fontWeight: "600",
  },
});
