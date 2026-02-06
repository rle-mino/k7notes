import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { execSync } from "node:child_process";
import { resolve } from "node:path";

let container: StartedPostgreSqlContainer;

export async function setup() {
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
