import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { execSync } from "node:child_process";
import { resolve } from "node:path";

let container: StartedPostgreSqlContainer;

export async function setup() {
  // Set required env vars so that env.ts Zod validation passes in test workers.
  // These are dummy values — tests use DI overrides, not these values.
  process.env.PORT = "4000";
  process.env.BASE_URL = "http://localhost:4000";
  process.env.GOOGLE_CLIENT_ID = "test-google-client-id";
  process.env.GOOGLE_CLIENT_SECRET = "test-google-client-secret";
  process.env.USE_CALENDAR_MOCKS = "true";
  process.env.GOOGLE_CALENDAR_CLIENT_ID = "test-google-calendar-client-id";
  process.env.GOOGLE_CALENDAR_CLIENT_SECRET = "test-google-calendar-client-secret";
  process.env.MICROSOFT_CALENDAR_CLIENT_ID = "test-microsoft-calendar-client-id";
  process.env.MICROSOFT_CALENDAR_CLIENT_SECRET = "test-microsoft-calendar-client-secret";

  // Start a PostgreSQL container for integration tests
  container = await new PostgreSqlContainer("postgres:16-alpine")
    .withDatabase("k7notes_test")
    .withUsername("test")
    .withPassword("test")
    .start();

  const connectionString = container.getConnectionUri();

  // Make the connection string available to test workers
  process.env.DATABASE_URL = connectionString;

  // Push the Drizzle schema to the test database.
  // globalSetup runs with cwd set to the package root (packages/api).
  const apiDir = resolve(__dirname, "..");

  execSync("npx drizzle-kit push --force", {
    cwd: apiDir,
    env: { ...process.env, DATABASE_URL: connectionString },
    stdio: "pipe",
  });
}

export async function teardown() {
  if (container) {
    await container.stop();
  }
}
