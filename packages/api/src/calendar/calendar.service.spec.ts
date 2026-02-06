import {
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { eq } from "drizzle-orm";
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import type { Database } from "../db/db.types.js";
import { calendarConnections } from "../db/schema.js";
import { createTestDb, type TestContext } from "../../test/create-test-module.js";
import { createTestUser, cleanupDb } from "../../test/helpers.js";
import { CalendarService } from "./calendar.service.js";
import type { ICalendarProvider, OAuthTokens, OAuthUserInfo } from "./providers/calendar-provider.interface.js";
import type { CalendarEvent, CalendarInfo } from "@k7notes/contracts";

// ---------------------------------------------------------------------------
// Mock providers
// ---------------------------------------------------------------------------
function createMockProvider(providerName: "google" | "microsoft"): ICalendarProvider & {
  getOAuthUrl: ReturnType<typeof vi.fn>;
  exchangeCodeForTokens: ReturnType<typeof vi.fn>;
  refreshAccessToken: ReturnType<typeof vi.fn>;
  getUserInfo: ReturnType<typeof vi.fn>;
  listCalendars: ReturnType<typeof vi.fn>;
  listEvents: ReturnType<typeof vi.fn>;
} {
  return {
    provider: providerName,
    getOAuthUrl: vi.fn().mockReturnValue(`https://mock-oauth.example.com/${providerName}?redirect=test`),
    exchangeCodeForTokens: vi.fn().mockResolvedValue({
      accessToken: `mock_access_${providerName}`,
      refreshToken: `mock_refresh_${providerName}`,
      expiresAt: new Date(Date.now() + 3600_000),
    } satisfies OAuthTokens),
    refreshAccessToken: vi.fn().mockResolvedValue({
      accessToken: `mock_refreshed_access_${providerName}`,
      refreshToken: `mock_refresh_${providerName}`,
      expiresAt: new Date(Date.now() + 3600_000),
    } satisfies OAuthTokens),
    getUserInfo: vi.fn().mockResolvedValue({
      email: `user@${providerName}.example.com`,
      name: `Mock ${providerName} User`,
    } satisfies OAuthUserInfo),
    listCalendars: vi.fn().mockResolvedValue([
      {
        id: "primary",
        name: "My Calendar",
        description: null,
        isPrimary: true,
        accessRole: "owner",
        backgroundColor: "#4285f4",
      },
    ] satisfies CalendarInfo[]),
    listEvents: vi.fn().mockResolvedValue([
      {
        id: "event-1",
        calendarId: "primary",
        title: "Mock Event",
        description: null,
        location: null,
        startTime: new Date("2025-01-01T10:00:00Z"),
        endTime: new Date("2025-01-01T11:00:00Z"),
        isAllDay: false,
        status: "confirmed",
        organizer: null,
        attendees: [],
        htmlLink: null,
      },
    ] satisfies CalendarEvent[]),
  };
}

// ---------------------------------------------------------------------------
// Helper: insert a calendar connection directly in the DB
// ---------------------------------------------------------------------------
async function insertConnection(
  db: Database,
  userId: string,
  overrides?: Partial<typeof calendarConnections.$inferInsert>,
) {
  const [row] = await db
    .insert(calendarConnections)
    .values({
      userId,
      provider: "google",
      accountEmail: "test@google.example.com",
      accountName: "Test Google User",
      accessToken: "valid_access_token",
      refreshToken: "valid_refresh_token",
      tokenExpiresAt: new Date(Date.now() + 3600_000), // 1 hour from now
      isActive: true,
      ...overrides,
    })
    .returning();

  return row!;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("CalendarService", () => {
  let testContext: TestContext;
  let service: CalendarService;
  let db: Database;

  let mockGoogleProvider: ReturnType<typeof createMockProvider>;
  let mockMicrosoftProvider: ReturnType<typeof createMockProvider>;

  let userA: { id: string };
  let userB: { id: string };

  beforeAll(async () => {
    testContext = createTestDb();
    db = testContext.db;

    mockGoogleProvider = createMockProvider("google");
    mockMicrosoftProvider = createMockProvider("microsoft");

    // Directly instantiate the service, passing mock providers
    service = new CalendarService(
      testContext.db,
      mockGoogleProvider as any,
      mockMicrosoftProvider as any,
    );
  });

  beforeEach(async () => {
    await cleanupDb(db);
    userA = await createTestUser(db);
    userB = await createTestUser(db);

    // Reset all mock provider functions between tests
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await testContext.pool.end();
  });

  // ---------------------------------------------------------------------------
  // listConnections
  // ---------------------------------------------------------------------------
  describe("listConnections", () => {
    it("should return connections for the given user", async () => {
      await insertConnection(db, userA.id, {
        provider: "google",
        accountEmail: "a@google.com",
      });
      await insertConnection(db, userA.id, {
        provider: "microsoft",
        accountEmail: "a@microsoft.com",
      });
      // Different user's connection -- should not be returned
      await insertConnection(db, userB.id, {
        provider: "google",
        accountEmail: "b@google.com",
      });

      const connections = await service.listConnections(userA.id);

      expect(connections).toHaveLength(2);
      expect(connections.map((c) => c.accountEmail).sort()).toEqual([
        "a@google.com",
        "a@microsoft.com",
      ]);
      // Verify shape
      for (const conn of connections) {
        expect(conn.userId).toBe(userA.id);
        expect(conn.id).toBeDefined();
        expect(conn.isActive).toBe(true);
        expect(conn.createdAt).toBeInstanceOf(Date);
        expect(conn.updatedAt).toBeInstanceOf(Date);
      }
    });

    it("should return empty array when user has no connections", async () => {
      const connections = await service.listConnections(userA.id);

      expect(connections).toEqual([]);
    });

    it("should not expose tokens in returned connections", async () => {
      await insertConnection(db, userA.id);

      const connections = await service.listConnections(userA.id);

      expect(connections).toHaveLength(1);
      const conn = connections[0]!;
      // The CalendarConnection type should NOT include token fields
      expect(conn).not.toHaveProperty("accessToken");
      expect(conn).not.toHaveProperty("refreshToken");
      expect(conn).not.toHaveProperty("tokenExpiresAt");
    });
  });

  // ---------------------------------------------------------------------------
  // getOAuthUrl
  // ---------------------------------------------------------------------------
  describe("getOAuthUrl", () => {
    it("should generate a URL via the provider", async () => {
      const result = await service.getOAuthUrl(userA.id, "google");

      expect(result.url).toBeDefined();
      expect(result.state).toBeDefined();
      expect(mockGoogleProvider.getOAuthUrl).toHaveBeenCalledOnce();
    });

    it("should encode provider, platform, userId, and uuid in state", async () => {
      const result = await service.getOAuthUrl(userA.id, "google");

      const parts = result.state.split(":");
      expect(parts.length).toBeGreaterThanOrEqual(4);
      expect(parts[0]).toBe("google");
      // platform
      expect(["web", "mobile"]).toContain(parts[1]);
      expect(parts[2]).toBe(userA.id);
      // uuid portion is non-empty
      expect(parts[3]!.length).toBeGreaterThan(0);
    });

    it("should detect mobile platform from custom scheme clientScheme", async () => {
      const result = await service.getOAuthUrl(
        userA.id,
        "google",
        "k7notes://calendar/callback",
      );

      const parts = result.state.split(":");
      expect(parts[1]).toBe("mobile");
    });

    it("should detect web platform when clientScheme is http URL or undefined", async () => {
      const resultNoScheme = await service.getOAuthUrl(userA.id, "google");
      expect(resultNoScheme.state.split(":")[1]).toBe("web");

      const resultHttp = await service.getOAuthUrl(
        userA.id,
        "google",
        "http://localhost:4001/callback",
      );
      expect(resultHttp.state.split(":")[1]).toBe("web");
    });

    it("should pass callback URL and state to the provider", async () => {
      const result = await service.getOAuthUrl(userA.id, "microsoft");

      expect(mockMicrosoftProvider.getOAuthUrl).toHaveBeenCalledWith(
        expect.stringContaining("/api/calendar/oauth/callback"),
        result.state,
      );
    });

    it("should throw BadRequestException for unsupported provider", async () => {
      await expect(
        service.getOAuthUrl(userA.id, "unsupported" as never),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ---------------------------------------------------------------------------
  // handleOAuthCallback
  // ---------------------------------------------------------------------------
  describe("handleOAuthCallback", () => {
    it("should create a new connection", async () => {
      const connection = await service.handleOAuthCallback(
        userA.id,
        "google",
        "auth_code_123",
      );

      expect(connection.id).toBeDefined();
      expect(connection.userId).toBe(userA.id);
      expect(connection.provider).toBe("google");
      expect(connection.accountEmail).toBe("user@google.example.com");
      expect(connection.accountName).toBe("Mock google User");
      expect(connection.isActive).toBe(true);

      expect(mockGoogleProvider.exchangeCodeForTokens).toHaveBeenCalledWith(
        "auth_code_123",
        expect.stringContaining("/api/calendar/oauth/callback"),
      );
      expect(mockGoogleProvider.getUserInfo).toHaveBeenCalledWith(
        "mock_access_google",
      );
    });

    it("should update an existing connection when same provider and email", async () => {
      // Insert an existing connection with the same email the mock provider will return
      const existing = await insertConnection(db, userA.id, {
        provider: "google",
        accountEmail: "user@google.example.com",
        accessToken: "old_access_token",
        isActive: false,
      });

      const connection = await service.handleOAuthCallback(
        userA.id,
        "google",
        "auth_code_456",
      );

      // Should reuse the same connection id
      expect(connection.id).toBe(existing.id);
      expect(connection.isActive).toBe(true);
      // Verify the token was updated in the database
      const [dbRow] = await db
        .select()
        .from(calendarConnections)
        .where(eq(calendarConnections.id, existing.id));
      expect(dbRow!.accessToken).toBe("mock_access_google");
    });

    it("should validate state userId and throw on mismatch", async () => {
      const maliciousState = `google:web:${userB.id}:some-uuid`;

      await expect(
        service.handleOAuthCallback(userA.id, "google", "code", maliciousState),
      ).rejects.toThrow(BadRequestException);
    });

    it("should accept valid state that matches userId", async () => {
      const validState = `google:web:${userA.id}:some-uuid`;

      const connection = await service.handleOAuthCallback(
        userA.id,
        "google",
        "code",
        validState,
      );

      expect(connection.userId).toBe(userA.id);
    });

    it("should create connection for microsoft provider", async () => {
      const connection = await service.handleOAuthCallback(
        userA.id,
        "microsoft",
        "ms_auth_code",
      );

      expect(connection.provider).toBe("microsoft");
      expect(connection.accountEmail).toBe("user@microsoft.example.com");
      expect(mockMicrosoftProvider.exchangeCodeForTokens).toHaveBeenCalledOnce();
      expect(mockMicrosoftProvider.getUserInfo).toHaveBeenCalledOnce();
    });
  });

  // ---------------------------------------------------------------------------
  // disconnect
  // ---------------------------------------------------------------------------
  describe("disconnect", () => {
    it("should delete the connection", async () => {
      const conn = await insertConnection(db, userA.id);

      await service.disconnect(userA.id, conn.id);

      // Verify it's gone
      const [row] = await db
        .select()
        .from(calendarConnections)
        .where(eq(calendarConnections.id, conn.id));
      expect(row).toBeUndefined();
    });

    it("should throw NotFoundException when connection belongs to another user", async () => {
      const conn = await insertConnection(db, userA.id);

      await expect(
        service.disconnect(userB.id, conn.id),
      ).rejects.toThrow(NotFoundException);

      // Verify the connection still exists
      const [row] = await db
        .select()
        .from(calendarConnections)
        .where(eq(calendarConnections.id, conn.id));
      expect(row).toBeDefined();
    });

    it("should throw NotFoundException when connection does not exist", async () => {
      await expect(
        service.disconnect(userA.id, "00000000-0000-0000-0000-000000000000"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // listCalendars
  // ---------------------------------------------------------------------------
  describe("listCalendars", () => {
    it("should delegate to provider with correct access token", async () => {
      const conn = await insertConnection(db, userA.id, {
        provider: "google",
        accessToken: "my_special_token",
        tokenExpiresAt: new Date(Date.now() + 3600_000), // not expired
      });

      const calendars = await service.listCalendars(userA.id, conn.id);

      expect(calendars).toHaveLength(1);
      expect(calendars[0]!.id).toBe("primary");
      expect(mockGoogleProvider.listCalendars).toHaveBeenCalledWith(
        "my_special_token",
      );
    });

    it("should throw NotFoundException for wrong user", async () => {
      const conn = await insertConnection(db, userA.id);

      await expect(
        service.listCalendars(userB.id, conn.id),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException for inactive connection", async () => {
      const conn = await insertConnection(db, userA.id, { isActive: false });

      await expect(
        service.listCalendars(userA.id, conn.id),
      ).rejects.toThrow(NotFoundException);
    });

    it("should delegate to microsoft provider for microsoft connections", async () => {
      const conn = await insertConnection(db, userA.id, {
        provider: "microsoft",
        accessToken: "ms_token",
      });

      await service.listCalendars(userA.id, conn.id);

      expect(mockMicrosoftProvider.listCalendars).toHaveBeenCalledWith("ms_token");
      expect(mockGoogleProvider.listCalendars).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // listEvents
  // ---------------------------------------------------------------------------
  describe("listEvents", () => {
    it("should delegate to provider with correct parameters", async () => {
      const conn = await insertConnection(db, userA.id, {
        provider: "google",
        accessToken: "events_token",
      });
      const start = new Date("2025-01-01");
      const end = new Date("2025-01-31");

      const events = await service.listEvents(
        userA.id,
        conn.id,
        "work-calendar",
        start,
        end,
        25,
      );

      expect(events).toHaveLength(1);
      expect(events[0]!.title).toBe("Mock Event");
      expect(mockGoogleProvider.listEvents).toHaveBeenCalledWith(
        "events_token",
        "work-calendar",
        start,
        end,
        25,
      );
    });

    it("should default calendarId to 'primary' when undefined", async () => {
      const conn = await insertConnection(db, userA.id, {
        provider: "google",
        accessToken: "events_token",
      });
      const start = new Date("2025-01-01");
      const end = new Date("2025-01-31");

      await service.listEvents(userA.id, conn.id, undefined, start, end, 50);

      expect(mockGoogleProvider.listEvents).toHaveBeenCalledWith(
        "events_token",
        "primary",
        start,
        end,
        50,
      );
    });

    it("should throw NotFoundException for wrong user", async () => {
      const conn = await insertConnection(db, userA.id);

      await expect(
        service.listEvents(
          userB.id,
          conn.id,
          "primary",
          new Date(),
          new Date(),
          10,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // Token refresh flow
  // ---------------------------------------------------------------------------
  describe("token refresh flow", () => {
    it("should refresh an expired token before delegating to provider", async () => {
      const conn = await insertConnection(db, userA.id, {
        provider: "google",
        accessToken: "expired_token",
        refreshToken: "valid_refresh",
        tokenExpiresAt: new Date(Date.now() - 60_000), // expired 1 minute ago
      });

      await service.listCalendars(userA.id, conn.id);

      // Should have refreshed the token
      expect(mockGoogleProvider.refreshAccessToken).toHaveBeenCalledWith(
        "valid_refresh",
      );
      // Should call listCalendars with the NEW access token
      expect(mockGoogleProvider.listCalendars).toHaveBeenCalledWith(
        "mock_refreshed_access_google",
      );
    });

    it("should persist refreshed tokens to the database", async () => {
      const conn = await insertConnection(db, userA.id, {
        provider: "google",
        accessToken: "expired_token",
        refreshToken: "valid_refresh",
        tokenExpiresAt: new Date(Date.now() - 60_000),
      });

      await service.listCalendars(userA.id, conn.id);

      // Verify the database was updated
      const [dbRow] = await db
        .select()
        .from(calendarConnections)
        .where(eq(calendarConnections.id, conn.id));
      expect(dbRow!.accessToken).toBe("mock_refreshed_access_google");
    });

    it("should not refresh when token is still valid", async () => {
      await insertConnection(db, userA.id, {
        provider: "google",
        accessToken: "still_valid",
        tokenExpiresAt: new Date(Date.now() + 3600_000), // 1 hour from now
      });

      const connections = await service.listConnections(userA.id);
      const conn = connections[0]!;

      await service.listCalendars(userA.id, conn.id);

      expect(mockGoogleProvider.refreshAccessToken).not.toHaveBeenCalled();
      expect(mockGoogleProvider.listCalendars).toHaveBeenCalledWith("still_valid");
    });

    it("should not refresh when tokenExpiresAt is null", async () => {
      const conn = await insertConnection(db, userA.id, {
        provider: "google",
        accessToken: "no_expiry_token",
        tokenExpiresAt: null,
      });

      await service.listCalendars(userA.id, conn.id);

      expect(mockGoogleProvider.refreshAccessToken).not.toHaveBeenCalled();
      expect(mockGoogleProvider.listCalendars).toHaveBeenCalledWith(
        "no_expiry_token",
      );
    });

    it("should mark connection inactive on refresh failure", async () => {
      const conn = await insertConnection(db, userA.id, {
        provider: "google",
        accessToken: "expired_token",
        refreshToken: "bad_refresh",
        tokenExpiresAt: new Date(Date.now() - 60_000),
      });

      mockGoogleProvider.refreshAccessToken.mockRejectedValueOnce(
        new Error("Token revoked"),
      );

      await expect(
        service.listCalendars(userA.id, conn.id),
      ).rejects.toThrow(BadRequestException);

      // Verify the connection was marked inactive
      const [dbRow] = await db
        .select()
        .from(calendarConnections)
        .where(eq(calendarConnections.id, conn.id));
      expect(dbRow!.isActive).toBe(false);
    });

    it("should not attempt refresh when refreshToken is null even if expired", async () => {
      const conn = await insertConnection(db, userA.id, {
        provider: "google",
        accessToken: "expired_but_no_refresh",
        refreshToken: null,
        tokenExpiresAt: new Date(Date.now() - 60_000),
      });

      // The service skips refresh when refreshToken is null and uses the expired token as-is
      await service.listCalendars(userA.id, conn.id);

      expect(mockGoogleProvider.refreshAccessToken).not.toHaveBeenCalled();
      expect(mockGoogleProvider.listCalendars).toHaveBeenCalledWith(
        "expired_but_no_refresh",
      );
    });
  });
});
