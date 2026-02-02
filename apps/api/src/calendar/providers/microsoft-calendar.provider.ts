import { Injectable, Logger } from "@nestjs/common";
import type { CalendarEvent, CalendarInfo } from "@k7notes/contracts";
import type {
  ICalendarProvider,
  OAuthTokens,
  OAuthUserInfo,
} from "./calendar-provider.interface.js";

const MS_OAUTH_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
const MS_TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
const MS_GRAPH_API = "https://graph.microsoft.com/v1.0";

const SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "Calendars.Read",
].join(" ");

interface MicrosoftTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

interface MicrosoftUserInfoResponse {
  mail?: string;
  userPrincipalName: string;
  displayName?: string;
}

interface MicrosoftCalendarListResponse {
  value?: MicrosoftCalendarItem[];
}

interface MicrosoftCalendarItem {
  id: string;
  name?: string;
  isDefaultCalendar?: boolean;
  canEdit?: boolean;
  hexColor?: string;
}

interface MicrosoftEventsResponse {
  value?: MicrosoftEventItem[];
}

interface MicrosoftEventItem {
  id: string;
  subject?: string;
  body?: { content?: string };
  location?: { displayName?: string };
  webLink?: string;
  showAs?: string;
  isAllDay?: boolean;
  start?: { dateTime?: string };
  end?: { dateTime?: string };
  organizer?: { emailAddress?: { address?: string; name?: string } };
  attendees?: Array<{
    emailAddress?: { address?: string; name?: string };
    status?: { response?: string };
  }>;
}

@Injectable()
export class MicrosoftCalendarProvider implements ICalendarProvider {
  readonly provider = "microsoft" as const;
  private readonly logger = new Logger(MicrosoftCalendarProvider.name);

  private get clientId(): string {
    return process.env.MICROSOFT_CALENDAR_CLIENT_ID || "";
  }

  private get clientSecret(): string {
    return process.env.MICROSOFT_CALENDAR_CLIENT_SECRET || "";
  }

  getOAuthUrl(redirectUrl: string, state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUrl,
      response_type: "code",
      scope: SCOPES,
      response_mode: "query",
      state,
    });

    return `${MS_OAUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForTokens(
    code: string,
    redirectUrl: string
  ): Promise<OAuthTokens> {
    const response = await fetch(MS_TOKEN_URL, {
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
      throw new Error("Failed to exchange authorization code");
    }

    const data = (await response.json()) as MicrosoftTokenResponse;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    const response = await fetch(MS_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
        scope: SCOPES,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Failed to refresh token: ${error}`);
      throw new Error("Failed to refresh access token");
    }

    const data = (await response.json()) as MicrosoftTokenResponse;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
    };
  }

  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    const response = await fetch(`${MS_GRAPH_API}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error("Failed to get user info");
    }

    const data = (await response.json()) as MicrosoftUserInfoResponse;

    return {
      email: data.mail || data.userPrincipalName,
      name: data.displayName || null,
    };
  }

  async listCalendars(accessToken: string): Promise<CalendarInfo[]> {
    const response = await fetch(`${MS_GRAPH_API}/me/calendars`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error("Failed to list calendars");
    }

    const data = (await response.json()) as MicrosoftCalendarListResponse;

    return (data.value || []).map((cal) => ({
      id: cal.id,
      name: cal.name || "Untitled",
      description: null, // Microsoft Graph doesn't provide description in list
      isPrimary: cal.isDefaultCalendar === true,
      accessRole: this.mapAccessRole(cal.canEdit === true),
      backgroundColor: cal.hexColor || null,
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
      startDateTime: startDate.toISOString(),
      endDateTime: endDate.toISOString(),
      $top: maxResults.toString(),
      $orderby: "start/dateTime",
      $select:
        "id,subject,body,location,start,end,isAllDay,showAs,organizer,attendees,webLink",
    });

    const response = await fetch(
      `${MS_GRAPH_API}/me/calendars/${calendarId}/calendarView?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!response.ok) {
      throw new Error("Failed to list events");
    }

    const data = (await response.json()) as MicrosoftEventsResponse;

    return (data.value || []).map((event) => this.mapEvent(event, calendarId));
  }

  private mapAccessRole(canEdit: boolean): "owner" | "writer" | "reader" | "freeBusyReader" {
    return canEdit ? "writer" : "reader";
  }

  private mapEvent(event: MicrosoftEventItem, calendarId: string): CalendarEvent {
    const start = event.start;
    const end = event.end;
    const organizer = event.organizer;
    const organizerEmail = organizer?.emailAddress;
    const attendees = event.attendees || [];
    const location = event.location;
    const body = event.body;

    const isAllDay = event.isAllDay === true;
    const startTime = new Date(start?.dateTime || "");
    const endTime = new Date(end?.dateTime || "");

    return {
      id: event.id,
      calendarId,
      title: event.subject || "Untitled",
      description: body?.content || null,
      location: location?.displayName || null,
      startTime,
      endTime,
      isAllDay,
      status: this.mapStatus(event.showAs || "busy"),
      organizer:
        organizerEmail && organizerEmail.address
          ? { email: organizerEmail.address, name: organizerEmail.name || null }
          : null,
      attendees: attendees.map((a) => ({
        email: a.emailAddress?.address || "",
        name: a.emailAddress?.name || null,
        responseStatus: this.mapResponseStatus(a.status?.response || "none"),
      })),
      htmlLink: event.webLink || null,
    };
  }

  private mapStatus(showAs: string): "confirmed" | "tentative" | "cancelled" {
    switch (showAs) {
      case "busy":
      case "oof":
      case "workingElsewhere":
        return "confirmed";
      case "tentative":
        return "tentative";
      case "free":
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
      case "tentativelyAccepted":
        return "tentative";
      case "notResponded":
      case "none":
      default:
        return "needsAction";
    }
  }
}
