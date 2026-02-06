import { inject } from "vitest";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { Database } from "../src/db/db.types.js";
import * as schema from "../src/db/schema.js";

export interface TestContext {
  db: Database;
  pool: Pool;
}

/**
 * Creates a Drizzle database instance connected to the test container.
 * The database URL is retrieved via Vitest's inject API (set by globalSetup's provide).
 *
 * Call `pool.end()` in afterAll to clean up the connection.
 */
export function createTestDb(): TestContext {
  const connectionString = inject("databaseUrl");
  if (!connectionString) {
    throw new Error(
      "databaseUrl is not provided. Ensure the Vitest globalSetup has run.",
    );
  }

  const pool = new Pool({ connectionString });
  const db = drizzle(pool, { schema });

  return { db, pool };
}
