import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { getApiUrl } from "./api";

/**
 * Better-auth client configured for Expo with SecureStore.
 *
 * The expoClient plugin handles:
 * - Secure token storage using expo-secure-store
 * - Deep link handling for OAuth callbacks
 * - Proper cookie handling for mobile
 */
export const authClient = createAuthClient({
  baseURL: getApiUrl(),
  basePath: "/api/auth",
  plugins: [
    expoClient({
      scheme: "k7notes",
      storagePrefix: "k7notes_auth",
      storage: SecureStore,
    }),
  ],
});

// Export hooks and utilities for use in components
export const { useSession, signIn, signUp, signOut } = authClient;

/**
 * Google sign-in helper.
 * Opens OAuth flow in browser and redirects back to app.
 * Note: Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on backend.
 */
export const signInWithGoogle = async () => {
  return authClient.signIn.social({
    provider: "google",
    callbackURL: "/", // Redirect back to app root
  });
};

// Type exports
export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;
