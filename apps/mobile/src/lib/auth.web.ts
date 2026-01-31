import { createAuthClient } from "better-auth/react";
import { getApiUrl } from "./api";

/**
 * Better-auth client for web - uses secure cookies (browser default).
 *
 * On web, better-auth automatically:
 * - Stores session in httpOnly cookies (set by server)
 * - Sends cookies with credentials on each request
 * - Handles CSRF protection
 */
export const authClient = createAuthClient({
  baseURL: getApiUrl(),
  basePath: "/api/auth",
  // No plugins needed - cookies work by default on web
});

// Export hooks and utilities for use in components
export const { useSession, signIn, signUp, signOut } = authClient;

/**
 * Google sign-in helper.
 * Opens OAuth flow in browser tab.
 */
export const signInWithGoogle = async () => {
  return authClient.signIn.social({
    provider: "google",
    callbackURL: "/",
  });
};

// Type exports
export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;
