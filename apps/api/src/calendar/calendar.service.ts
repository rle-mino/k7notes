import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { calendarConnections } from "../db/schema.js";
import type {
  CalendarProvider,
  CalendarConnection,
  CalendarEvent,
  CalendarInfo,
} from "@k7notes/contracts";
import { GoogleCalendarProvider } from "./providers/google-calendar.provider.js";
import { MicrosoftCalendarProvider } from "./providers/microsoft-calendar.provider.js";
import { MockCalendarProvider } from "./providers/mock-calendar.provider.js";
import type { ICalendarProvider } from "./providers/calendar-provider.interface.js";
import { randomUUID } from "crypto";

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);
  private readonly providers: Map<CalendarProvider, ICalendarProvider>;
  private readonly useMocks: boolean;

  constructor(
    private readonly googleProvider: GoogleCalendarProvider,
    private readonly microsoftProvider: MicrosoftCalendarProvider
  ) {
    this.useMocks = process.env.USE_CALENDAR_MOCKS === "true";
    this.providers = new Map<CalendarProvider, ICalendarProvider>();

    if (this.useMocks) {
      this.logger.log("Calendar mocks enabled - using mock providers");
      this.providers.set("google", new MockCalendarProvider("google"));
      this.providers.set("microsoft", new MockCalendarProvider("microsoft"));
    } else {
      this.providers.set("google", googleProvider);
      this.providers.set("microsoft", microsoftProvider);
    }
  }

  private getProvider(provider: CalendarProvider): ICalendarProvider {
    const p = this.providers.get(provider);
    if (!p) {
      throw new BadRequestException(`Unsupported calendar provider: ${provider}`);
    }
    return p;
  }

  async listConnections(userId: string): Promise<CalendarConnection[]> {
    const connections = await db
      .select({
        id: calendarConnections.id,
        userId: calendarConnections.userId,
        provider: calendarConnections.provider,
        accountEmail: calendarConnections.accountEmail,
        accountName: calendarConnections.accountName,
        isActive: calendarConnections.isActive,
        createdAt: calendarConnections.createdAt,
        updatedAt: calendarConnections.updatedAt,
      })
      .from(calendarConnections)
      .where(eq(calendarConnections.userId, userId));

    return connections.map((c) => ({
      ...c,
      provider: c.provider as CalendarProvider,
    }));
  }

  async getOAuthUrl(
    userId: string,
    provider: CalendarProvider,
    redirectUrl?: string
  ): Promise<{ url: string; state: string }> {
    const calendarProvider = this.getProvider(provider);

    // Encode the provider in the state so the callback knows which provider to use
    // Format: provider:uuid (e.g., "google:abc-123-def")
    const stateId = randomUUID();
    const state = `${provider}:${stateId}`;
    const baseUrl = process.env.BASE_URL || "http://localhost:4000";
    const callbackUrl = redirectUrl || `${baseUrl}/api/calendar/oauth/callback`;

    const url = calendarProvider.getOAuthUrl(callbackUrl, state);

    return { url, state };
  }

  async handleOAuthCallback(
    userId: string,
    provider: CalendarProvider,
    code: string,
    state?: string
  ): Promise<CalendarConnection> {
    const calendarProvider = this.getProvider(provider);
    const baseUrl = process.env.BASE_URL || "http://localhost:4000";
    const callbackUrl = `${baseUrl}/api/calendar/oauth/callback`;

    // Exchange code for tokens
    const tokens = await calendarProvider.exchangeCodeForTokens(code, callbackUrl);

    // Get user info from provider
    const userInfo = await calendarProvider.getUserInfo(tokens.accessToken);

    // Check if connection already exists
    const existing = await db
      .select()
      .from(calendarConnections)
      .where(
        and(
          eq(calendarConnections.userId, userId),
          eq(calendarConnections.provider, provider),
          eq(calendarConnections.accountEmail, userInfo.email)
        )
      )
      .limit(1);

    const existingConnection = existing[0];
    if (existingConnection) {
      // Update existing connection
      const updateResult = await db
        .update(calendarConnections)
        .set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken || existingConnection.refreshToken,
          tokenExpiresAt: tokens.expiresAt,
          accountName: userInfo.name,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(calendarConnections.id, existingConnection.id))
        .returning({
          id: calendarConnections.id,
          userId: calendarConnections.userId,
          provider: calendarConnections.provider,
          accountEmail: calendarConnections.accountEmail,
          accountName: calendarConnections.accountName,
          isActive: calendarConnections.isActive,
          createdAt: calendarConnections.createdAt,
          updatedAt: calendarConnections.updatedAt,
        });

      const updated = updateResult[0];
      if (!updated) {
        throw new Error("Failed to update calendar connection");
      }

      return {
        id: updated.id,
        userId: updated.userId,
        provider: updated.provider as CalendarProvider,
        accountEmail: updated.accountEmail,
        accountName: updated.accountName,
        isActive: updated.isActive,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    }

    // Create new connection
    const insertResult = await db
      .insert(calendarConnections)
      .values({
        userId,
        provider,
        accountEmail: userInfo.email,
        accountName: userInfo.name,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: tokens.expiresAt,
      })
      .returning({
        id: calendarConnections.id,
        userId: calendarConnections.userId,
        provider: calendarConnections.provider,
        accountEmail: calendarConnections.accountEmail,
        accountName: calendarConnections.accountName,
        isActive: calendarConnections.isActive,
        createdAt: calendarConnections.createdAt,
        updatedAt: calendarConnections.updatedAt,
      });

    const connection = insertResult[0];
    if (!connection) {
      throw new Error("Failed to create calendar connection");
    }

    return {
      id: connection.id,
      userId: connection.userId,
      provider: connection.provider as CalendarProvider,
      accountEmail: connection.accountEmail,
      accountName: connection.accountName,
      isActive: connection.isActive,
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt,
    };
  }

  async disconnect(userId: string, connectionId: string): Promise<void> {
    const [connection] = await db
      .select()
      .from(calendarConnections)
      .where(
        and(
          eq(calendarConnections.id, connectionId),
          eq(calendarConnections.userId, userId)
        )
      )
      .limit(1);

    if (!connection) {
      throw new NotFoundException("Calendar connection not found");
    }

    await db
      .delete(calendarConnections)
      .where(eq(calendarConnections.id, connectionId));
  }

  async listCalendars(
    userId: string,
    connectionId: string
  ): Promise<CalendarInfo[]> {
    const connection = await this.getConnectionWithToken(userId, connectionId);
    const provider = this.getProvider(connection.provider as CalendarProvider);

    return provider.listCalendars(connection.accessToken);
  }

  async listEvents(
    userId: string,
    connectionId: string,
    calendarId: string | undefined,
    startDate: Date,
    endDate: Date,
    maxResults: number
  ): Promise<CalendarEvent[]> {
    const connection = await this.getConnectionWithToken(userId, connectionId);
    const provider = this.getProvider(connection.provider as CalendarProvider);

    // Use primary calendar if not specified
    const targetCalendarId = calendarId || "primary";

    return provider.listEvents(
      connection.accessToken,
      targetCalendarId,
      startDate,
      endDate,
      maxResults
    );
  }

  private async getConnectionWithToken(
    userId: string,
    connectionId: string
  ): Promise<{
    id: string;
    provider: string;
    accessToken: string;
    refreshToken: string | null;
    tokenExpiresAt: Date | null;
  }> {
    const [connection] = await db
      .select({
        id: calendarConnections.id,
        provider: calendarConnections.provider,
        accessToken: calendarConnections.accessToken,
        refreshToken: calendarConnections.refreshToken,
        tokenExpiresAt: calendarConnections.tokenExpiresAt,
      })
      .from(calendarConnections)
      .where(
        and(
          eq(calendarConnections.id, connectionId),
          eq(calendarConnections.userId, userId),
          eq(calendarConnections.isActive, true)
        )
      )
      .limit(1);

    if (!connection) {
      throw new NotFoundException("Calendar connection not found or inactive");
    }

    // Check if token needs refresh
    if (
      connection.tokenExpiresAt &&
      connection.tokenExpiresAt < new Date() &&
      connection.refreshToken
    ) {
      const provider = this.getProvider(connection.provider as CalendarProvider);
      const newTokens = await provider.refreshAccessToken(connection.refreshToken);

      await db
        .update(calendarConnections)
        .set({
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken || connection.refreshToken,
          tokenExpiresAt: newTokens.expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(calendarConnections.id, connectionId));

      return {
        ...connection,
        accessToken: newTokens.accessToken,
      };
    }

    return connection;
  }
}
