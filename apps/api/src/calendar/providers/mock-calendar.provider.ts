import { Injectable, Logger } from "@nestjs/common";
import type { CalendarEvent, CalendarInfo, CalendarProvider } from "@k7notes/contracts";
import type {
  ICalendarProvider,
  OAuthTokens,
  OAuthUserInfo,
} from "./calendar-provider.interface.js";

const MOCK_CALENDARS: CalendarInfo[] = [
  {
    id: "primary",
    name: "My Calendar",
    description: "Primary calendar for work and personal events",
    isPrimary: true,
    accessRole: "owner",
    backgroundColor: "#4285f4",
  },
  {
    id: "work",
    name: "Work",
    description: "Work-related meetings and deadlines",
    isPrimary: false,
    accessRole: "writer",
    backgroundColor: "#0f9d58",
  },
  {
    id: "personal",
    name: "Personal",
    description: "Personal appointments and reminders",
    isPrimary: false,
    accessRole: "writer",
    backgroundColor: "#db4437",
  },
];

function generateMockEvents(
  calendarId: string,
  startDate: Date,
  endDate: Date,
  maxResults: number
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / msPerDay);

  const eventTemplates = [
    { title: "Team Standup", duration: 30, isAllDay: false },
    { title: "Project Review", duration: 60, isAllDay: false },
    { title: "Lunch with Client", duration: 90, isAllDay: false },
    { title: "Sprint Planning", duration: 120, isAllDay: false },
    { title: "Company Holiday", duration: 0, isAllDay: true },
    { title: "One-on-One", duration: 30, isAllDay: false },
    { title: "Workshop", duration: 180, isAllDay: false },
    { title: "Deadline", duration: 0, isAllDay: true },
  ];

  for (let i = 0; i < Math.min(daysDiff * 2, maxResults); i++) {
    const templateIndex = i % eventTemplates.length;
    const template = eventTemplates[templateIndex];
    if (!template) continue;

    const dayOffset = Math.floor(i / 2);
    const eventDate = new Date(startDate.getTime() + dayOffset * msPerDay);

    if (eventDate > endDate) break;

    if (template.isAllDay) {
      const eventStart = new Date(eventDate);
      eventStart.setHours(0, 0, 0, 0);
      const eventEnd = new Date(eventStart);
      eventEnd.setDate(eventEnd.getDate() + 1);

      events.push({
        id: `mock-${calendarId}-${i}`,
        calendarId,
        title: template.title,
        description: `Mock event for testing: ${template.title}`,
        location: null,
        startTime: eventStart,
        endTime: eventEnd,
        isAllDay: true,
        status: "confirmed",
        organizer: { email: "mock@example.com", name: "Mock User" },
        attendees: [],
        htmlLink: null,
      });
    } else {
      const hour = 9 + (i % 8); // Events between 9 AM and 5 PM
      const eventStart = new Date(eventDate);
      eventStart.setHours(hour, 0, 0, 0);
      const eventEnd = new Date(eventStart.getTime() + template.duration * 60 * 1000);

      events.push({
        id: `mock-${calendarId}-${i}`,
        calendarId,
        title: template.title,
        description: `Mock event for testing: ${template.title}`,
        location: i % 3 === 0 ? "Conference Room A" : null,
        startTime: eventStart,
        endTime: eventEnd,
        isAllDay: false,
        status: i % 5 === 0 ? "tentative" : "confirmed",
        organizer: { email: "mock@example.com", name: "Mock User" },
        attendees:
          i % 2 === 0
            ? [
                { email: "colleague@example.com", name: "Colleague", responseStatus: "accepted" },
                { email: "manager@example.com", name: "Manager", responseStatus: "tentative" },
              ]
            : [],
        htmlLink: `https://calendar.example.com/event/mock-${calendarId}-${i}`,
      });
    }
  }

  return events;
}

@Injectable()
export class MockCalendarProvider implements ICalendarProvider {
  readonly provider: CalendarProvider;
  private readonly logger = new Logger(MockCalendarProvider.name);

  constructor(provider: CalendarProvider) {
    this.provider = provider;
    this.logger.log(`Mock calendar provider initialized for: ${provider}`);
  }

  getOAuthUrl(redirectUrl: string, state: string): string {
    // Return a mock OAuth URL that points back to our callback
    const params = new URLSearchParams({
      mock: "true",
      provider: this.provider,
      state,
      redirect_uri: redirectUrl,
    });

    return `${redirectUrl}?${params.toString()}`;
  }

  async exchangeCodeForTokens(
    code: string,
    redirectUrl: string
  ): Promise<OAuthTokens> {
    this.logger.log(`Mock: exchanging code for tokens (code: ${code})`);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      accessToken: `mock_access_token_${this.provider}_${Date.now()}`,
      refreshToken: `mock_refresh_token_${this.provider}_${Date.now()}`,
      expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    this.logger.log(`Mock: refreshing access token`);

    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      accessToken: `mock_access_token_${this.provider}_${Date.now()}`,
      refreshToken,
      expiresAt: new Date(Date.now() + 3600 * 1000),
    };
  }

  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    this.logger.log(`Mock: getting user info`);

    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      email: `mock.user@${this.provider === "google" ? "gmail.com" : "outlook.com"}`,
      name: `Mock ${this.provider === "google" ? "Google" : "Microsoft"} User`,
    };
  }

  async listCalendars(accessToken: string): Promise<CalendarInfo[]> {
    this.logger.log(`Mock: listing calendars`);

    await new Promise((resolve) => setTimeout(resolve, 100));

    return MOCK_CALENDARS;
  }

  async listEvents(
    accessToken: string,
    calendarId: string,
    startDate: Date,
    endDate: Date,
    maxResults: number
  ): Promise<CalendarEvent[]> {
    this.logger.log(
      `Mock: listing events for calendar ${calendarId} from ${startDate.toISOString()} to ${endDate.toISOString()}`
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    return generateMockEvents(calendarId, startDate, endDate, maxResults);
  }
}
