module.exports = {
  extends: ["@k7notes/eslint-config"],
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
    sourceType: "module",
  },
  root: true,
  rules: {
    "@typescript-eslint/explicit-module-boundary-types": "off",
  },
  ignorePatterns: [
    "node_modules",
    ".expo",
    "dist",
    "web-build",
    "*.config.js",
    ".eslintrc.js",
  ],
};
