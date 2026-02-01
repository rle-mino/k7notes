/**
 * oRPC API client for K7Notes backend
 *
 * Uses EXPO_PUBLIC_API_URL environment variable for the base URL.
 * All public env vars in Expo must be prefixed with EXPO_PUBLIC_.
 *
 * In Expo SDK 52+, environment variables prefixed with EXPO_PUBLIC_ are
 * automatically inlined by the Metro bundler at build time.
 */

// Default fallback URL for development
const DEFAULT_API_URL = "http://localhost:4000";

// EXPO_PUBLIC_ variables are replaced at build time by Metro
const getEnvVar = (key: string): string | undefined => {
  // This works at runtime because Metro replaces the reference
  const globalEnv = (globalThis as Record<string, unknown>).__EXPO_ENV__;
  if (typeof globalEnv === "object" && globalEnv !== null) {
    return (globalEnv as Record<string, string>)[key];
  }
  return undefined;
};

const API_URL = getEnvVar("EXPO_PUBLIC_API_URL") ?? DEFAULT_API_URL;

/**
 * Get the configured API URL (for debugging)
 */
export function getApiUrl(): string {
  return API_URL;
}

// Types are re-exported from orpc.ts - import from there instead
// This file only contains utilities that don't depend on @k7notes/contracts
// to avoid loading @orpc/contract at module initialization time.

// Legacy API support for health checks and debugging
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
}

/**
 * Check API health status (not part of oRPC contract)
 */
export async function checkHealth(): Promise<ApiResponse<HealthResponse>> {
  try {
    const url = `${API_URL}/health`;
    const response = await fetch(url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return {
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
