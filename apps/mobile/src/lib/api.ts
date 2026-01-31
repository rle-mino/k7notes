/**
 * API client for K7Notes backend
 *
 * Uses EXPO_PUBLIC_API_URL environment variable for the base URL.
 * All public env vars in Expo must be prefixed with EXPO_PUBLIC_.
 *
 * In Expo SDK 52+, environment variables prefixed with EXPO_PUBLIC_ are
 * automatically inlined by the Metro bundler at build time.
 */

// Default fallback URL for development
const DEFAULT_API_URL = "http://localhost:3000";

// EXPO_PUBLIC_ variables are replaced at build time by Metro
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getEnvVar = (key: string): string | undefined => {
  // This works at runtime because Metro replaces the reference
  const globalEnv = (globalThis as Record<string, unknown>).__EXPO_ENV__;
  if (typeof globalEnv === "object" && globalEnv !== null) {
    return (globalEnv as Record<string, string>)[key];
  }
  return undefined;
};

const API_URL = getEnvVar("EXPO_PUBLIC_API_URL") ?? DEFAULT_API_URL;

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
}

/**
 * Generic fetch wrapper with error handling
 */
export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
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

/**
 * Check API health status
 */
export async function checkHealth(): Promise<ApiResponse<HealthResponse>> {
  return fetchApi<HealthResponse>("/health");
}

/**
 * Get the configured API URL (for debugging)
 */
export function getApiUrl(): string {
  return API_URL;
}
