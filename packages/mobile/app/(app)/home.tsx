import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { authClient } from "@/lib/auth";

export default function HomeScreen() {
  const session = authClient.useSession();
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

        {session.data?.user && (
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{session.data.user.name}</Text>
            <Text style={styles.userEmail}>{session.data.user.email}</Text>
          </View>
        )}

        <View style={styles.navGrid}>
          <TouchableOpacity
            style={styles.navCard}
            onPress={() => router.push("/notes")}
            activeOpacity={0.7}
          >
            <Text style={styles.navIcon}>notes</Text>
            <Text style={styles.navTitle}>Notes</Text>
            <Text style={styles.navSubtitle}>View and create notes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navCard}
            onPress={() => router.push("/search")}
            activeOpacity={0.7}
          >
            <Text style={styles.navIcon}>search</Text>
            <Text style={styles.navTitle}>Search</Text>
            <Text style={styles.navSubtitle}>Find notes quickly</Text>
          </TouchableOpacity>
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
    marginBottom: 24,
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
  navGrid: {
    gap: 16,
  },
  navCard: {
    backgroundColor: "#f8f8f8",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#eee",
  },
  navIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  navTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  navSubtitle: {
    fontSize: 14,
    color: "#666",
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
