import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import type { Database } from "../src/db/db.types.js";
import { user, notes, folders } from "../src/db/schema.js";

/**
 * Creates a test user and returns the inserted record.
 */
export async function createTestUser(
  db: Database,
  overrides?: Partial<typeof user.$inferInsert>,
) {
  const id = overrides?.id ?? randomUUID();
  const [created] = await db
    .insert(user)
    .values({
      id,
      name: `Test User ${id.slice(0, 8)}`,
      email: `test-${id.slice(0, 8)}@example.com`,
      emailVerified: false,
      ...overrides,
    })
    .returning();

  return created!;
}

/**
 * Creates a test note for the given user and returns the inserted record.
 */
export async function createTestNote(
  db: Database,
  userId: string,
  overrides?: Partial<Omit<typeof notes.$inferInsert, "userId">>,
) {
  const [created] = await db
    .insert(notes)
    .values({
      userId,
      title: "Test Note",
      content: "Test content",
      folderId: null,
      ...overrides,
    })
    .returning();

  return created!;
}

/**
 * Creates a test folder for the given user and returns the inserted record.
 */
export async function createTestFolder(
  db: Database,
  userId: string,
  overrides?: Partial<Omit<typeof folders.$inferInsert, "userId">>,
) {
  const [created] = await db
    .insert(folders)
    .values({
      userId,
      name: "Test Folder",
      parentId: null,
      ...overrides,
    })
    .returning();

  return created!;
}

/**
 * Truncates all tables in the correct order (respecting foreign keys).
 * Uses TRUNCATE ... CASCADE for efficiency.
 */
export async function cleanupDb(db: Database) {
  await db.execute(sql`TRUNCATE TABLE
    calendar_connections,
    transcriptions,
    user_preferences,
    notes,
    folders,
    session,
    account,
    verification,
    health_check,
    "user"
    CASCADE`);
}
