import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  test: {
    root: "src",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    environment: "jsdom",
    globals: true,
    passWithNoTests: true,
  },
});
