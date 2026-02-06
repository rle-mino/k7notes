/**
 * oRPC API client for K7Notes backend
 *
 * In Expo SDK 52+, environment variables prefixed with EXPO_PUBLIC_ are
 * automatically inlined by the Metro bundler at build time.
 *
 * Web and native use separate env vars since the browser can reach localhost
 * but real devices need a tunnel like ngrok.
 */

import { Platform } from "react-native";
import { z } from "zod";

const envSchema = z.object({
  EXPO_PUBLIC_WEB_API_URL: z.string().url(),
  EXPO_PUBLIC_NATIVE_API_URL: z.string().url(),
});

const env = envSchema.parse({
  EXPO_PUBLIC_WEB_API_URL: process.env.EXPO_PUBLIC_WEB_API_URL,
  EXPO_PUBLIC_NATIVE_API_URL: process.env.EXPO_PUBLIC_NATIVE_API_URL,
});

const API_URL =
  Platform.OS === "web"
    ? env.EXPO_PUBLIC_WEB_API_URL
    : env.EXPO_PUBLIC_NATIVE_API_URL;

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
