import { useCallback, useState, useRef } from "react";
import { Platform } from "react-native";
import { storage } from "@/lib/storage";
import { orpc } from "@/lib/orpc";
import type { CalendarConnection, CalendarProvider } from "@/lib/orpc";
import { CALENDAR_CALLBACK_URL } from "@/constants/app";

const PENDING_OAUTH_KEY = "k7notes_pending_oauth_provider";

export function useCalendarConnections() {
  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if we've done initial load
  const hasLoaded = useRef(false);

  const fetchConnections = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (!hasLoaded.current) {
        setLoading(true);
      }
      setError(null);

      const result = await orpc.calendar.listConnections();
      setConnections(result);
      hasLoaded.current = true;
    } catch (err) {
      console.error("Failed to fetch calendar connections:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load calendar connections"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const getOAuthUrl = useCallback(
    async (provider: CalendarProvider) => {
      try {
        // On native platforms, pass the deep link scheme so the API knows to redirect back to the app
        // On web, don't pass redirectUrl so it uses the web callback
        const redirectUrl = Platform.OS !== "web" ? CALENDAR_CALLBACK_URL : undefined;

        const result = await orpc.calendar.getOAuthUrl({
          provider,
          redirectUrl,
        });
        // Store the provider so the callback knows which provider to use (fallback)
        await storage.setItem(PENDING_OAUTH_KEY, provider);
        return result;
      } catch (err) {
        console.error("Failed to get OAuth URL:", err);
        throw err;
      }
    },
    []
  );

  /**
   * Get the pending OAuth provider from storage
   */
  const getPendingProvider = useCallback(async (): Promise<CalendarProvider | null> => {
    try {
      const provider = await storage.getItem(PENDING_OAUTH_KEY);
      return provider as CalendarProvider | null;
    } catch (err) {
      console.error("Failed to get pending OAuth provider:", err);
      return null;
    }
  }, []);

  /**
   * Clear the pending OAuth provider from storage
   */
  const clearPendingProvider = useCallback(async () => {
    try {
      await storage.removeItem(PENDING_OAUTH_KEY);
    } catch (err) {
      console.error("Failed to clear pending OAuth provider:", err);
    }
  }, []);

  const handleOAuthCallback = useCallback(
    async (provider: CalendarProvider, code: string, state?: string) => {
      try {
        const connection = await orpc.calendar.handleOAuthCallback({
          provider,
          code,
          state,
        });
        // Add to connections list
        setConnections((prev) => {
          // Replace if already exists, otherwise add
          const exists = prev.find((c) => c.id === connection.id);
          if (exists) {
            return prev.map((c) => (c.id === connection.id ? connection : c));
          }
          return [...prev, connection];
        });
        return connection;
      } catch (err) {
        console.error("Failed to handle OAuth callback:", err);
        throw err;
      }
    },
    []
  );

  const disconnect = useCallback(async (connectionId: string) => {
    try {
      await orpc.calendar.disconnect({ connectionId });
      setConnections((prev) => prev.filter((c) => c.id !== connectionId));
    } catch (err) {
      console.error("Failed to disconnect calendar:", err);
      throw err;
    }
  }, []);

  return {
    connections,
    loading,
    refreshing,
    error,
    fetchConnections,
    getOAuthUrl,
    getPendingProvider,
    clearPendingProvider,
    handleOAuthCallback,
    disconnect,
    refresh: () => fetchConnections(true),
  };
}
