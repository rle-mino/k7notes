/**
 * Global setup for Playwright tests.
 * Runs once before all tests to prepare the test environment.
 *
 * This file handles:
 * - Database connection validation
 * - Test data cleanup from previous runs
 *
 * Note: Server startup is handled by Playwright's webServer config in playwright.config.ts
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { initTestDatabase, closeTestDatabase } from "./utils/db";
import { cleanupTestData, cleanupTestUsersByEmail } from "./utils/cleanup";

// Load .env from e2e package
dotenv.config({ path: path.resolve(__dirname, ".env") });

async function globalSetup() {
  console.log("Running global setup...");

  try {
    // Initialize database connection
    console.log("Connecting to test database...");
    await initTestDatabase();
    console.log("Database connection established.");

    // Clean up any leftover test data from previous runs
    console.log("Cleaning up leftover test data...");
    const cleaned = await cleanupTestData();
    console.log(
      `Cleaned up: ${cleaned.users} users, ${cleaned.notes} notes, ${cleaned.folders} folders`
    );

    // Also clean up users with test email patterns that may have been left behind
    const emailCleanup = await cleanupTestUsersByEmail("%@test.k7notes.local");
    if (emailCleanup > 0) {
      console.log(`Cleaned up ${emailCleanup} test users by email pattern.`);
    }

    console.log("Global setup complete.");
  } catch (error) {
    console.error("Global setup failed:", error);
    throw error;
  } finally {
    // Close database connection (tests will open their own connections)
    await closeTestDatabase();
  }
}

export default globalSetup;
