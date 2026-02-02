/**
 * Test cleanup utilities for e2e tests.
 *
 * Provides helpers to clean up test data after tests complete.
 * Always clean up in reverse order of creation to handle foreign key constraints.
 */

import { eq, like, or, sql } from "drizzle-orm";
import { getTestDatabase, schema, closeTestDatabase } from "./db";

// ============================================================================
// Individual Table Cleanup
// ============================================================================

/**
 * Delete all notes for a specific user.
 */
export async function cleanupUserNotes(userId: string): Promise<number> {
  const db = getTestDatabase();
  const result = await db
    .delete(schema.notes)
    .where(eq(schema.notes.userId, userId))
    .returning({ id: schema.notes.id });
  return result.length;
}

/**
 * Delete all folders for a specific user.
 */
export async function cleanupUserFolders(userId: string): Promise<number> {
  const db = getTestDatabase();
  const result = await db
    .delete(schema.folders)
    .where(eq(schema.folders.userId, userId))
    .returning({ id: schema.folders.id });
  return result.length;
}

/**
 * Delete all sessions for a specific user.
 */
export async function cleanupUserSessions(userId: string): Promise<number> {
  const db = getTestDatabase();
  const result = await db
    .delete(schema.session)
    .where(eq(schema.session.userId, userId))
    .returning({ id: schema.session.id });
  return result.length;
}

/**
 * Delete all accounts for a specific user.
 */
export async function cleanupUserAccounts(userId: string): Promise<number> {
  const db = getTestDatabase();
  const result = await db
    .delete(schema.account)
    .where(eq(schema.account.userId, userId))
    .returning({ id: schema.account.id });
  return result.length;
}

/**
 * Delete a specific user and all associated data.
 * Due to CASCADE constraints, this will also delete related records.
 */
export async function cleanupUser(userId: string): Promise<void> {
  const db = getTestDatabase();

  // Delete in order respecting foreign key constraints
  // Note: Most tables have ON DELETE CASCADE, but we're explicit for safety
  await cleanupUserNotes(userId);
  await cleanupUserFolders(userId);
  await cleanupUserSessions(userId);
  await cleanupUserAccounts(userId);

  // Finally delete the user
  await db.delete(schema.user).where(eq(schema.user.id, userId));
}

// ============================================================================
// Test Data Cleanup (by prefix)
// ============================================================================

/**
 * Clean up all test data created with the test_ prefix.
 * This is useful for cleaning up after test runs without affecting real data.
 */
export async function cleanupTestData(): Promise<{
  notes: number;
  folders: number;
  sessions: number;
  accounts: number;
  users: number;
}> {
  const db = getTestDatabase();
  const testPrefix = "test_%";

  // Find all test users
  const testUsers = await db
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(like(schema.user.id, testPrefix));

  let notesDeleted = 0;
  let foldersDeleted = 0;
  let sessionsDeleted = 0;
  let accountsDeleted = 0;

  // Clean up each test user's data
  for (const testUser of testUsers) {
    notesDeleted += await cleanupUserNotes(testUser.id);
    foldersDeleted += await cleanupUserFolders(testUser.id);
    sessionsDeleted += await cleanupUserSessions(testUser.id);
    accountsDeleted += await cleanupUserAccounts(testUser.id);
  }

  // Delete all test users
  const deletedUsers = await db
    .delete(schema.user)
    .where(like(schema.user.id, testPrefix))
    .returning({ id: schema.user.id });

  return {
    notes: notesDeleted,
    folders: foldersDeleted,
    sessions: sessionsDeleted,
    accounts: accountsDeleted,
    users: deletedUsers.length,
  };
}

/**
 * Clean up test data by email pattern.
 * Useful for cleaning up users created with specific email domains.
 */
export async function cleanupTestUsersByEmail(
  emailPattern: string
): Promise<number> {
  const db = getTestDatabase();

  // Find matching users
  const users = await db
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(like(schema.user.email, emailPattern));

  // Clean up each user
  for (const user of users) {
    await cleanupUser(user.id);
  }

  return users.length;
}

// ============================================================================
// Full Database Cleanup
// ============================================================================

/**
 * WARNING: This deletes ALL data from all tables.
 * Only use this for test database setup/teardown.
 */
export async function cleanupAllData(): Promise<void> {
  const db = getTestDatabase();

  // Delete in order respecting foreign key constraints
  await db.delete(schema.notes);
  await db.delete(schema.folders);
  await db.delete(schema.calendarConnections);
  await db.delete(schema.session);
  await db.delete(schema.account);
  await db.delete(schema.verification);
  await db.delete(schema.user);
  await db.delete(schema.healthCheck);
}

/**
 * Truncate all tables (faster than DELETE for large datasets).
 * WARNING: Only use this for test database setup/teardown.
 */
export async function truncateAllTables(): Promise<void> {
  const db = getTestDatabase();

  // Use TRUNCATE with CASCADE to handle foreign keys
  await db.execute(sql`
    TRUNCATE TABLE
      notes,
      folders,
      calendar_connections,
      session,
      account,
      verification,
      "user",
      health_check
    CASCADE
  `);
}

// ============================================================================
// Cleanup Utilities
// ============================================================================

/**
 * Clean up specific records by their IDs.
 */
export async function cleanupNotesByIds(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;

  const db = getTestDatabase();
  const conditions = ids.map((id) => eq(schema.notes.id, id));
  const result = await db
    .delete(schema.notes)
    .where(or(...conditions))
    .returning({ id: schema.notes.id });
  return result.length;
}

export async function cleanupFoldersByIds(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;

  const db = getTestDatabase();
  const conditions = ids.map((id) => eq(schema.folders.id, id));
  const result = await db
    .delete(schema.folders)
    .where(or(...conditions))
    .returning({ id: schema.folders.id });
  return result.length;
}

export async function cleanupUsersByIds(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;

  // Clean up each user's data first (respects CASCADE)
  for (const id of ids) {
    await cleanupUser(id);
  }

  return ids.length;
}

// ============================================================================
// Global Teardown
// ============================================================================

/**
 * Complete teardown function for use in global teardown.
 * Cleans up test data and closes the database connection.
 */
export async function globalTeardown(): Promise<void> {
  try {
    // Clean up any remaining test data
    await cleanupTestData();

    // Also clean up users with test email patterns
    await cleanupTestUsersByEmail("%@example.com");
    await cleanupTestUsersByEmail("e2e-%@%");
  } catch (error) {
    console.error("Error during cleanup:", error);
  } finally {
    // Always close the database connection
    await closeTestDatabase();
  }
}
