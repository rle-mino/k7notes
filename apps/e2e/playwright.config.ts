import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for K7Notes e2e tests.
 * Configures separate projects for web and API testing.
 */
export default defineConfig({
  testDir: "./tests",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
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
    },
    {
      name: "api",
      use: {
        baseURL: "http://localhost:4000",
      },
      testMatch: "**/api/**/*.spec.ts",
    },
  ],

  /* Run your local dev servers before starting the tests */
  // webServer: [
  //   {
  //     command: "pnpm turbo dev --filter=@k7notes/api",
  //     url: "http://localhost:4000/health",
  //     reuseExistingServer: !process.env.CI,
  //   },
  //   {
  //     command: "pnpm turbo web --filter=@k7notes/mobile",
  //     url: "http://localhost:4001",
  //     reuseExistingServer: !process.env.CI,
  //   },
  // ],
});
