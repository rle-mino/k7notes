import "@/i18n";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Link, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { authClient, signInWithGoogle } from "@/lib/auth";

export default function LoginScreen() {
  const { t } = useTranslation();
  const { data: session, isPending } = authClient.useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Redirect to app if already authenticated
  useEffect(() => {
    if (!isPending && session?.user) {
      router.replace("/(app)/notes");
    }
  }, [isPending, session]);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert(t("common.error"), t("auth.errorFillFields"));
      return;
    }

    setLoading(true);
    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        Alert.alert(t("auth.signInFailed"), error.message || t("auth.errorInvalidCredentials"));
      } else {
        // Success: navigate to notes tab
        router.replace("/(app)/notes");
      }
    } catch (err) {
      Alert.alert(t("common.error"), t("auth.errorNetwork"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();

      if (error) {
        Alert.alert(
          t("auth.googleSignInFailed"),
          error.message || t("auth.errorGoogleMessage")
        );
      } else {
        // Success: navigate to notes tab
        router.replace("/(app)/notes");
      }
    } catch (err) {
      Alert.alert(t("common.error"), t("auth.errorGoogle"));
    } finally {
      setGoogleLoading(false);
    }
  };

  // Show loading while checking session
  if (isPending) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{t("auth.appName")}</Text>
        <Text style={styles.subtitle}>{t("auth.signInToContinue")}</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder={t("auth.email")}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder={t("auth.password")}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignIn}
            disabled={loading || googleLoading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t("auth.signIn")}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t("auth.or")}</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            styles.googleButton,
            googleLoading && styles.buttonDisabled,
          ]}
          onPress={handleGoogleSignIn}
          disabled={loading || googleLoading}
        >
          {googleLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t("auth.signInWithGoogle")}</Text>
          )}
        </TouchableOpacity>

        <Link href="/(auth)/signup" asChild>
          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkText}>
              {t("auth.noAccount")}{" "}
              <Text style={styles.linkBold}>{t("auth.signUp")}</Text>
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 40,
  },
  form: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  googleButton: {
    backgroundColor: "#4285F4",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#666",
  },
  linkButton: {
    marginTop: 24,
    alignItems: "center",
  },
  linkText: {
    color: "#666",
    fontSize: 14,
  },
  linkBold: {
    color: "#007AFF",
    fontWeight: "600",
  },
});
