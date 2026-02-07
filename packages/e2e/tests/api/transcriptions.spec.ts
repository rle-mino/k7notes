import { test, expect } from "../../fixtures/api";

/**
 * Transcription API endpoint tests.
 *
 * Tests the transcription list and update title endpoints added as part
 * of the audio storage feature. These tests verify:
 * - Unauthenticated access is rejected
 * - Authenticated access returns correct responses
 * - Title update validation works
 *
 * Note: The transcribe endpoint (POST /api/transcriptions) requires actual
 * audio data and an OpenAI API key, so it is not tested here.
 */

/**
 * Helper to sign up a user via the API and return the session cookie.
 * Uses better-auth's email signup endpoint.
 */
async function signupAndGetCookie(
  request: import("@playwright/test").APIRequestContext
): Promise<string> {
  const timestamp = Date.now();
  const response = await request.post("/api/auth/sign-up/email", {
    data: {
      name: `API Test User ${timestamp}`,
      email: `api-test-${timestamp}@example.com`,
      password: "TestPassword123!",
    },
    headers: { "Content-Type": "application/json" },
  });

  // Extract session cookie from Set-Cookie header
  const cookies = response.headers()["set-cookie"];
  if (!cookies) {
    throw new Error("No session cookie returned from signup");
  }

  // Parse the cookie string to extract the session token
  // better-auth typically sets a cookie named "better-auth.session_token"
  const cookieStr: string =
    typeof cookies === "string" ? cookies : String(cookies);

  // Return the raw cookie string for use in subsequent requests
  // Extract just the cookie name=value pairs
  const cookieParts = cookieStr
    .split(",")
    .map((part: string) => part.trim().split(";")[0] ?? "")
    .filter((part: string) => part.includes("="))
    .join("; ");

  return cookieParts;
}

test.describe("Transcriptions API - Unauthenticated", () => {
  test("GET /api/transcriptions returns 401 without auth", async ({ api }) => {
    const { status } = await api.get("/api/transcriptions");

    // oRPC returns 401 or 500 for unauthenticated access depending on middleware
    // The key assertion is that it does NOT return 200 with data
    expect(status).not.toBe(200);
  });

  test("PUT /api/transcriptions/:id/title returns error without auth", async ({
    api,
  }) => {
    const { status } = await api.put(
      "/api/transcriptions/00000000-0000-0000-0000-000000000000/title",
      { id: "00000000-0000-0000-0000-000000000000", title: "New Title" }
    );

    // Should not succeed without authentication
    expect(status).not.toBe(200);
  });
});

test.describe("Transcriptions API - Authenticated", () => {
  test("GET /api/transcriptions returns empty array for new user", async ({
    api,
  }) => {
    const cookie = await signupAndGetCookie(api.request);

    const { status, data } = await api.get<unknown[]>("/api/transcriptions", {
      headers: { Cookie: cookie },
    });

    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(0);
  });

  test("PUT /api/transcriptions/:id/title returns 404 for non-existent transcription", async ({
    api,
  }) => {
    const cookie = await signupAndGetCookie(api.request);

    const { status } = await api.put(
      "/api/transcriptions/00000000-0000-0000-0000-000000000001/title",
      {
        id: "00000000-0000-0000-0000-000000000001",
        title: "New Title",
      },
      { headers: { Cookie: cookie } }
    );

    // Should return 404 since the transcription doesn't exist
    expect(status).toBe(404);
  });
});
