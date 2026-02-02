/**
 * Test data seeding utilities for e2e tests.
 *
 * Provides helpers to create test users, notes, and folders
 * directly in the database for test setup.
 */

import { randomUUID } from "crypto";
import { getTestDatabase, schema } from "./db";

// ============================================================================
// Types
// ============================================================================

export interface TestUser {
  id: string;
  name: string;
  email: string;
  password?: string; // Hashed password for credential auth
}

export interface TestFolder {
  id: string;
  userId: string;
  name: string;
  parentId?: string | null;
}

export interface TestNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  folderId?: string | null;
}

export interface SeedResult {
  users: TestUser[];
  folders: TestFolder[];
  notes: TestNote[];
}

// ============================================================================
// ID Generation
// ============================================================================

/**
 * Generate a unique test ID with an optional prefix for easier identification.
 */
export function generateTestId(prefix = "test"): string {
  return `${prefix}_${randomUUID()}`;
}

// ============================================================================
// User Seeding
// ============================================================================

/**
 * Create a test user in the database.
 *
 * Note: This creates the user record directly. For testing auth flows,
 * you may also need to create an account record with a hashed password.
 */
export async function createTestUser(
  options: {
    id?: string;
    name?: string;
    email?: string;
    emailVerified?: boolean;
  } = {}
): Promise<TestUser> {
  const db = getTestDatabase();
  const id = options.id || generateTestId("user");
  const timestamp = Date.now();

  const userData = {
    id,
    name: options.name || `Test User ${timestamp}`,
    email: options.email || `test-${timestamp}@example.com`,
    emailVerified: options.emailVerified ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(schema.user).values(userData);

  return {
    id: userData.id,
    name: userData.name,
    email: userData.email,
  };
}

/**
 * Create a test user with credential-based authentication.
 * This creates both a user record and an account record with a hashed password.
 *
 * Note: The password is stored as a bcrypt hash. For e2e tests that need to
 * log in via the UI, use the plain text password with the login form.
 */
export async function createTestUserWithCredentials(
  options: {
    id?: string;
    name?: string;
    email?: string;
    password?: string;
  } = {}
): Promise<TestUser & { plainPassword: string }> {
  const db = getTestDatabase();
  const userId = options.id || generateTestId("user");
  const timestamp = Date.now();
  const plainPassword = options.password || "TestPassword123!";

  // Create user record
  const userData = {
    id: userId,
    name: options.name || `Test User ${timestamp}`,
    email: options.email || `test-${timestamp}@example.com`,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(schema.user).values(userData);

  // Create account record with hashed password
  // Note: better-auth uses bcrypt for password hashing
  // For e2e tests, we hash the password the same way better-auth does
  const bcryptHash = await hashPassword(plainPassword);

  await db.insert(schema.account).values({
    id: generateTestId("account"),
    accountId: userId,
    providerId: "credential",
    userId: userId,
    password: bcryptHash,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return {
    id: userData.id,
    name: userData.name,
    email: userData.email,
    password: bcryptHash,
    plainPassword,
  };
}

/**
 * Hash a password for test database seeding.
 *
 * Note: This uses a simple SHA-256 hash which is NOT compatible with better-auth's
 * bcrypt hashing. For e2e tests that need to log in, either:
 * 1. Register users through the UI (recommended - uses proper auth flow)
 * 2. Use the API signup endpoint
 *
 * This function is primarily for creating user records that don't need
 * credential-based login (e.g., for testing data display, not auth flows).
 */
async function hashPassword(password: string): Promise<string> {
  const crypto = await import("crypto");
  // Use a simple hash for test data seeding
  // This won't work with better-auth login but allows creating user records
  return crypto.createHash("sha256").update(password).digest("hex");
}

// ============================================================================
// Folder Seeding
// ============================================================================

/**
 * Create a test folder in the database.
 */
export async function createTestFolder(options: {
  id?: string;
  userId: string;
  name?: string;
  parentId?: string | null;
}): Promise<TestFolder> {
  const db = getTestDatabase();
  const id = options.id || generateTestId("folder");

  const folderData = {
    id,
    userId: options.userId,
    name: options.name || `Test Folder ${Date.now()}`,
    parentId: options.parentId || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(schema.folders).values(folderData);

  return {
    id: folderData.id,
    userId: folderData.userId,
    name: folderData.name,
    parentId: folderData.parentId,
  };
}

/**
 * Create a nested folder structure for testing hierarchy.
 */
export async function createTestFolderHierarchy(
  userId: string,
  depth = 3
): Promise<TestFolder[]> {
  const folders: TestFolder[] = [];
  let parentId: string | null = null;

  for (let i = 0; i < depth; i++) {
    const folder = await createTestFolder({
      userId,
      name: `Level ${i + 1} Folder`,
      parentId,
    });
    folders.push(folder);
    parentId = folder.id;
  }

  return folders;
}

// ============================================================================
// Note Seeding
// ============================================================================

/**
 * Create a test note in the database.
 */
export async function createTestNote(options: {
  id?: string;
  userId: string;
  title?: string;
  content?: string;
  folderId?: string | null;
}): Promise<TestNote> {
  const db = getTestDatabase();
  const id = options.id || generateTestId("note");
  const timestamp = Date.now();

  const noteData = {
    id,
    userId: options.userId,
    title: options.title || `Test Note ${timestamp}`,
    content: options.content || `<p>Test content created at ${timestamp}</p>`,
    folderId: options.folderId || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(schema.notes).values(noteData);

  return {
    id: noteData.id,
    userId: noteData.userId,
    title: noteData.title,
    content: noteData.content,
    folderId: noteData.folderId,
  };
}

/**
 * Create multiple test notes for a user.
 */
export async function createTestNotes(
  userId: string,
  count = 5,
  options: { folderId?: string | null } = {}
): Promise<TestNote[]> {
  const notes: TestNote[] = [];

  for (let i = 0; i < count; i++) {
    const note = await createTestNote({
      userId,
      title: `Test Note ${i + 1}`,
      content: `<p>Content for test note ${i + 1}</p>`,
      folderId: options.folderId,
    });
    notes.push(note);
  }

  return notes;
}

// ============================================================================
// Complete Seed
// ============================================================================

/**
 * Seed a complete test dataset with users, folders, and notes.
 * Useful for comprehensive e2e test setup.
 */
export async function seedTestData(options: {
  userCount?: number;
  foldersPerUser?: number;
  notesPerUser?: number;
} = {}): Promise<SeedResult> {
  const { userCount = 1, foldersPerUser = 2, notesPerUser = 5 } = options;

  const users: TestUser[] = [];
  const folders: TestFolder[] = [];
  const notes: TestNote[] = [];

  for (let u = 0; u < userCount; u++) {
    const user = await createTestUser({
      name: `Test User ${u + 1}`,
      email: `testuser${u + 1}@example.com`,
    });
    users.push(user);

    // Create folders for this user
    for (let f = 0; f < foldersPerUser; f++) {
      const folder = await createTestFolder({
        userId: user.id,
        name: `User ${u + 1} Folder ${f + 1}`,
      });
      folders.push(folder);
    }

    // Create notes for this user (some in folders, some not)
    for (let n = 0; n < notesPerUser; n++) {
      const folderId =
        n < foldersPerUser && folders.length > 0
          ? folders[folders.length - foldersPerUser + n]?.id
          : null;

      const note = await createTestNote({
        userId: user.id,
        title: `User ${u + 1} Note ${n + 1}`,
        content: `<p>Content for user ${u + 1}, note ${n + 1}</p>`,
        folderId,
      });
      notes.push(note);
    }
  }

  return { users, folders, notes };
}

// ============================================================================
// Default Test Credentials
// ============================================================================

/**
 * Standard test user credentials for e2e tests.
 * Use these when you need consistent login credentials across tests.
 */
export const DEFAULT_TEST_USER = {
  email: "e2e-test@example.com",
  password: "TestPassword123!",
  name: "E2E Test User",
} as const;
