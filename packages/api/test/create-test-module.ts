import { Global, Module, type Type } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { DB_TOKEN, type Database } from "../src/db/db.types.js";
import * as schema from "../src/db/schema.js";

export interface TestContext {
  db: Database;
  pool: Pool;
}

/**
 * Creates a Drizzle database instance connected to the test container.
 * The DATABASE_URL environment variable must be set by globalSetup.
 *
 * Call `pool.end()` in afterAll to clean up the connection.
 */
export function createTestDb(): TestContext {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Ensure the Vitest globalSetup has run.",
    );
  }

  const pool = new Pool({ connectionString });
  const db = drizzle(pool, { schema });

  return { db, pool };
}

/**
 * Creates a compiled NestJS TestingModule for the given service module,
 * with DB_TOKEN overridden to use the test database connection.
 *
 * Usage:
 * ```ts
 * const ctx = createTestDb();
 * const module = await createTestModule(NotesModule, ctx);
 * const service = module.get(NotesService);
 * ```
 */
export async function createTestModule(
  moduleUnderTest: Type,
  testContext: TestContext,
): Promise<TestingModule> {
  @Global()
  @Module({
    providers: [{ provide: DB_TOKEN, useValue: testContext.db }],
    exports: [DB_TOKEN],
  })
  class TestDatabaseModule {}

  return Test.createTestingModule({
    imports: [TestDatabaseModule, moduleUnderTest],
  }).compile();
}
