import { Injectable, Logger } from "@nestjs/common";
import type { CalendarEvent, CalendarInfo } from "@k7notes/contracts";
import type {
  ICalendarProvider,
  OAuthTokens,
  OAuthUserInfo,
} from "./calendar-provider.interface.js";
import { env } from "../../env.js";

const GOOGLE_OAUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
].join(" ");

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

interface GoogleUserInfoResponse {
  email: string;
  name?: string;
}

interface GoogleCalendarListResponse {
  items?: GoogleCalendarItem[];
}

interface GoogleCalendarItem {
  id: string;
  summary?: string;
  description?: string;
  primary?: boolean;
  accessRole?: string;
  backgroundColor?: string;
}

interface GoogleEventsResponse {
  items?: GoogleEventItem[];
}

interface GoogleEventItem {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  status?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
  organizer?: { email?: string; displayName?: string };
  attendees?: Array<{
    email?: string;
    displayName?: string;
    responseStatus?: string;
  }>;
}

@Injectable()
export class GoogleCalendarProvider implements ICalendarProvider {
  readonly provider = "google" as const;
  private readonly logger = new Logger(GoogleCalendarProvider.name);

  private get clientId(): string {
    return env.GOOGLE_CALENDAR_CLIENT_ID;
  }

  private get clientSecret(): string {
    return env.GOOGLE_CALENDAR_CLIENT_SECRET;
  }

  getOAuthUrl(redirectUrl: string, state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUrl,
      response_type: "code",
      scope: SCOPES,
      access_type: "offline",
      prompt: "consent",
      state,
    });

    return `${GOOGLE_OAUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForTokens(
    code: string,
    redirectUrl: string
  ): Promise<OAuthTokens> {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: redirectUrl,
        grant_type: "authorization_code",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Failed to exchange code for tokens: ${error}`);
      throw new Error("Failed to connect to Google Calendar. Please try again.");
    }

    const data = (await response.json()) as GoogleTokenResponse;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Failed to refresh token: ${error}`);
      throw new Error("Failed to refresh Google Calendar access. Please reconnect your calendar.");
    }

    const data = (await response.json()) as GoogleTokenResponse;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
    };
  }

  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    const response = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error("Failed to retrieve Google account information.");
    }

    const data = (await response.json()) as GoogleUserInfoResponse;

    return {
      email: data.email,
      name: data.name || null,
    };
  }

  async listCalendars(accessToken: string): Promise<CalendarInfo[]> {
    const response = await fetch(`${GOOGLE_CALENDAR_API}/users/me/calendarList`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error("Failed to retrieve calendars from Google Calendar.");
    }

    const data = (await response.json()) as GoogleCalendarListResponse;

    return (data.items || []).map((cal) => ({
      id: cal.id,
      name: cal.summary || "Untitled",
      description: cal.description || null,
      isPrimary: cal.primary === true,
      accessRole: this.mapAccessRole(cal.accessRole || "reader"),
      backgroundColor: cal.backgroundColor || null,
    }));
  }

  async listEvents(
    accessToken: string,
    calendarId: string,
    startDate: Date,
    endDate: Date,
    maxResults: number
  ): Promise<CalendarEvent[]> {
    const params = new URLSearchParams({
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      maxResults: maxResults.toString(),
      singleEvents: "true",
      orderBy: "startTime",
    });

    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!response.ok) {
      throw new Error("Failed to retrieve events from Google Calendar.");
    }

    const data = (await response.json()) as GoogleEventsResponse;

    return (data.items || []).map((event) => this.mapEvent(event, calendarId));
  }

  private mapAccessRole(
    role: string
  ): "owner" | "writer" | "reader" | "freeBusyReader" {
    switch (role) {
      case "owner":
        return "owner";
      case "writer":
        return "writer";
      case "reader":
        return "reader";
      case "freeBusyReader":
        return "freeBusyReader";
      default:
        return "reader";
    }
  }

  private mapEvent(event: GoogleEventItem, calendarId: string): CalendarEvent {
    const start = event.start;
    const end = event.end;
    const organizer = event.organizer;
    const attendees = event.attendees || [];

    const isAllDay = !!start?.date;
    const startTime = isAllDay
      ? new Date(start?.date || "")
      : new Date(start?.dateTime || "");
    const endTime = isAllDay
      ? new Date(end?.date || "")
      : new Date(end?.dateTime || "");

    return {
      id: event.id,
      calendarId,
      title: event.summary || "Untitled",
      description: event.description || null,
      location: event.location || null,
      startTime,
      endTime,
      isAllDay,
      status: this.mapStatus(event.status || "confirmed"),
      organizer:
        organizer && organizer.email
          ? { email: organizer.email, name: organizer.displayName || null }
          : null,
      attendees: attendees.map((a) => ({
        email: a.email || "",
        name: a.displayName || null,
        responseStatus: this.mapResponseStatus(a.responseStatus || "needsAction"),
      })),
      htmlLink: event.htmlLink || null,
    };
  }

  private mapStatus(status: string): "confirmed" | "tentative" | "cancelled" {
    switch (status) {
      case "confirmed":
        return "confirmed";
      case "tentative":
        return "tentative";
      case "cancelled":
        return "cancelled";
      default:
        return "confirmed";
    }
  }

  private mapResponseStatus(
    status: string
  ): "accepted" | "declined" | "tentative" | "needsAction" {
    switch (status) {
      case "accepted":
        return "accepted";
      case "declined":
        return "declined";
      case "tentative":
        return "tentative";
      default:
        return "needsAction";
    }
  }
}
