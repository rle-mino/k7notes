import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    root: "src",
    include: ["**/*.spec.ts"],
    globals: true,
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
    },
  },
});
