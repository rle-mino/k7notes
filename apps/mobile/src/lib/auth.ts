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

// Type exports
export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;
