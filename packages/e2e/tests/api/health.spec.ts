import { test, expect } from "../../fixtures/api";

/**
 * Health check tests for the K7Notes API.
 * These tests verify API connectivity and database health.
 * Should be run before other tests to ensure the environment is ready.
 */

test.describe("API Health Checks", () => {
  test("GET /health returns ok status", async ({ api }) => {
    const { status, data } = await api.get<{
      status: string;
      timestamp: string;
    }>("/health");

    expect(status).toBe(200);
    expect(data.status).toBe("ok");
    expect(data.timestamp).toBeTruthy();
    // Verify timestamp is a valid ISO 8601 date
    expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);
  });

  test("GET /health/db returns database connection status", async ({ api }) => {
    const { status, data } = await api.get<{
      status: string;
      database: string;
      timestamp?: string;
      error?: string;
    }>("/health/db");

    expect(status).toBe(200);
    expect(data.status).toBe("ok");
    expect(data.database).toBe("connected");
    expect(data.timestamp).toBeTruthy();
  });

  test("health endpoints respond within acceptable time", async ({ api }) => {
    const startTime = Date.now();

    await api.get("/health");
    const healthTime = Date.now() - startTime;

    const dbStartTime = Date.now();
    await api.get("/health/db");
    const dbHealthTime = Date.now() - dbStartTime;

    // Health check should respond within 100ms
    expect(healthTime).toBeLessThan(100);
    // Database health check should respond within 500ms (includes DB query)
    expect(dbHealthTime).toBeLessThan(500);
  });
});

test.describe("API Connectivity", () => {
  test("API server is reachable", async ({ api }) => {
    const { status } = await api.get("/health");
    expect(status).toBe(200);
  });

  test("API returns JSON content type", async ({ api }) => {
    const response = await api.request.get("/health");
    const contentType = response.headers()["content-type"];

    expect(contentType).toContain("application/json");
  });
});
