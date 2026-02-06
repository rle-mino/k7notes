import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    root: "src",
    include: ["**/*.spec.ts"],
    globals: true,
    passWithNoTests: true,
    globalSetup: ["../test/setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 120_000,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
    },
  },
});
