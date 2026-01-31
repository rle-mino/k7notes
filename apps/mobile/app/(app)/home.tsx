import { StyleSheet, Text, View, Pressable } from "react-native";
import { router } from "expo-router";

export default function HomeScreen() {
  const handleLogout = () => {
    // TODO: Implement actual logout with better-auth
    // For now, navigate back to login
    router.replace("/(auth)/login");
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>K7Notes</Text>
        <Text style={styles.subtitle}>Your meeting notes will appear here</Text>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>No meetings yet</Text>
          <Text style={styles.placeholderHint}>
            Start a new meeting to begin capturing notes
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Sign Out</Text>
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
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 4,
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
    backgroundColor: "#f5f5f5",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
});
