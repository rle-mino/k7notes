import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env from e2e package
dotenv.config({ path: path.resolve(__dirname, ".env") });

// Validate TEST_DATABASE_URL is set
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL environment variable is required for e2e tests.\n" +
      "Copy packages/e2e/.env.example to packages/e2e/.env and set TEST_DATABASE_URL"
  );
}

// Safety check: prevent accidental use of production database
if (testDatabaseUrl.includes("prod") || testDatabaseUrl.includes("production")) {
  throw new Error(
    "TEST_DATABASE_URL appears to point to a production database. Aborting."
  );
}

/**
 * Playwright configuration for K7Notes e2e tests.
 * Configures separate projects for web and API testing.
 *
 * The webServer config automatically starts the API and web servers
 * with the test database before running tests.
 */
export default defineConfig({
  testDir: "./tests",
  /* Global setup to prepare test environment */
  globalSetup: "./global-setup.ts",
  /* Global teardown to clean up test servers */
  globalTeardown: "./global-teardown.ts",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  /* Retry failed tests to handle flakiness */
  retries: 2,
  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use */
  reporter: process.env.CI ? "github" : "html",
  /* Shared settings for all the projects below */
  use: {
    /* Collect trace when retrying the failed test */
    trace: "on-first-retry",
    /* Base URL for web tests */
    baseURL: "http://localhost:4001",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "web",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:4001",
      },
      testIgnore: "**/api/**/*.spec.ts", // API tests run in api project only
    },
    {
      name: "api",
      use: {
        baseURL: "http://localhost:4000",
      },
      testMatch: "**/api/**/*.spec.ts",
    },
  ],

  /* Run your local dev servers before starting the tests.
   * Each command first kills any process on the target port to avoid EADDRINUSE,
   * then starts the server. This makes e2e tests resilient to leftover processes
   * from dev servers or previous failed test runs. */
  webServer: [
    {
      command:
        "lsof -ti :4000 | xargs kill -9 2>/dev/null || true; pnpm turbo dev --filter=@k7notes/api",
      url: "http://localhost:4000/health",
      reuseExistingServer: false,
      env: {
        DATABASE_URL: testDatabaseUrl,
      },
      timeout: 120000, // 2 minutes for server startup
    },
    {
      command:
        "lsof -ti :4001 | xargs kill -9 2>/dev/null || true; pnpm turbo start --filter=@k7notes/mobile -- --web",
      url: "http://localhost:4001",
      reuseExistingServer: false,
      timeout: 120000,
    },
  ],
});
