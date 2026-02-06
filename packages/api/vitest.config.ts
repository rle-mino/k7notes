import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    root: "src",
    include: ["**/*.spec.ts"],
    globals: true,
    passWithNoTests: true,
    fileParallelism: false,
    globalSetup: ["../test/setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 120_000,
    // Dummy env vars so env.ts Zod validation passes in test workers.
    // The real DATABASE_URL is injected via Vitest's provide/inject API
    // in createTestDb(). This dummy value satisfies the Zod schema only.
    env: {
      PORT: "4000",
      BASE_URL: "http://localhost:4000",
      DATABASE_URL: "postgresql://dummy:dummy@localhost:5432/dummy",
      GOOGLE_CLIENT_ID: "test-google-client-id",
      GOOGLE_CLIENT_SECRET: "test-google-client-secret",
      USE_CALENDAR_MOCKS: "false",
      GOOGLE_CALENDAR_CLIENT_ID: "test-google-calendar-client-id",
      GOOGLE_CALENDAR_CLIENT_SECRET: "test-google-calendar-client-secret",
      MICROSOFT_CALENDAR_CLIENT_ID: "test-microsoft-calendar-client-id",
      MICROSOFT_CALENDAR_CLIENT_SECRET: "test-microsoft-calendar-client-secret",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
    },
  },
});
