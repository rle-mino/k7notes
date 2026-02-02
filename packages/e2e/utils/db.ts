/**
 * Test database connection utilities for e2e tests.
 *
 * Uses a separate TEST_DATABASE_URL to avoid polluting the development database.
 * The schema is imported from @k7notes/api to ensure consistency.
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { schema } from "@k7notes/api/dist/db/index.js";

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Get the test database URL from environment variables.
 * Requires TEST_DATABASE_URL to be explicitly set to prevent accidental use of dev database.
 *
 * Note: Playwright config also validates this at startup, but we check here too
 * for utilities that might be used outside of Playwright context.
 */
function getTestDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL;

  if (!url) {
    throw new Error(
      "TEST_DATABASE_URL environment variable is required for e2e tests.\n" +
        "This ensures tests run against a dedicated test database, not your development database.\n" +
        "Set TEST_DATABASE_URL in packages/e2e/.env (see .env.example)"
    );
  }

  // Safety check: prevent accidental use of production database
  if (url.includes("prod") || url.includes("production")) {
    throw new Error(
      "TEST_DATABASE_URL appears to point to a production database. Aborting."
    );
  }

  return url;
}

/**
 * Initialize the test database connection.
 * Call this before running tests that require database access.
 */
export async function initTestDatabase(): Promise<
  ReturnType<typeof drizzle<typeof schema>>
> {
  if (db) {
    return db;
  }

  const connectionString = getTestDatabaseUrl();

  pool = new Pool({
    connectionString,
    max: 5, // Limit connections for test environment
  });

  db = drizzle(pool, { schema });

  // Verify connection
  try {
    await pool.query("SELECT 1");
  } catch (error) {
    await closeTestDatabase();
    throw new Error(
      `Failed to connect to test database: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  return db;
}

/**
 * Get the initialized test database instance.
 * Throws if the database has not been initialized.
 */
export function getTestDatabase(): ReturnType<typeof drizzle<typeof schema>> {
  if (!db) {
    throw new Error(
      "Test database not initialized. Call initTestDatabase() first."
    );
  }
  return db;
}

/**
 * Get the raw pool for direct queries if needed.
 */
export function getTestPool(): Pool {
  if (!pool) {
    throw new Error(
      "Test database not initialized. Call initTestDatabase() first."
    );
  }
  return pool;
}

/**
 * Close the test database connection.
 * Call this after all tests have completed.
 */
export async function closeTestDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}

/**
 * Check if the test database is connected and healthy.
 */
export async function isTestDatabaseHealthy(): Promise<boolean> {
  if (!pool) {
    return false;
  }

  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

// Re-export schema for convenience
export { schema };
