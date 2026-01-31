import { useEffect, useState, useCallback } from 'react';
import { addDatabaseChangeListener } from 'expo-sqlite';

/**
 * Hook that re-runs a query function when any table in the database changes.
 * Uses expo-sqlite's enableChangeListener feature.
 *
 * @param queryFn - Async function that returns data from the database
 * @param deps - Additional dependencies that should trigger re-fetch
 * @returns { data, loading, error, refetch }
 */
export function useLiveQuery<T>(
  queryFn: () => Promise<T>,
  deps: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await queryFn();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Query failed'));
    } finally {
      setLoading(false);
    }
  }, [queryFn, ...deps]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Subscribe to database changes
  // Note: expo-sqlite addDatabaseChangeListener listens to all databases with enableChangeListener
  useEffect(() => {
    const subscription = addDatabaseChangeListener(() => {
      fetchData();
    });

    return () => {
      subscription.remove();
    };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
