import type {
  CalendarEvent,
  CalendarInfo,
  CalendarProvider,
} from "@k7notes/contracts";

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface OAuthUserInfo {
  email: string;
  name: string | null;
}

export interface ICalendarProvider {
  readonly provider: CalendarProvider;

  /**
   * Generate the OAuth authorization URL for the provider
   */
  getOAuthUrl(redirectUrl: string, state: string): string;

  /**
   * Exchange an OAuth authorization code for tokens
   */
  exchangeCodeForTokens(code: string, redirectUrl: string): Promise<OAuthTokens>;

  /**
   * Refresh an expired access token
   */
  refreshAccessToken(refreshToken: string): Promise<OAuthTokens>;

  /**
   * Get user info from the provider using access token
   */
  getUserInfo(accessToken: string): Promise<OAuthUserInfo>;

  /**
   * List all calendars accessible by the user
   */
  listCalendars(accessToken: string): Promise<CalendarInfo[]>;

  /**
   * List events from a calendar within a date range
   */
  listEvents(
    accessToken: string,
    calendarId: string,
    startDate: Date,
    endDate: Date,
    maxResults: number
  ): Promise<CalendarEvent[]>;
}
