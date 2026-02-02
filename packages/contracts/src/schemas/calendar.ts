import { z } from "zod";

// Calendar provider types
export const CalendarProviderSchema = z.enum(["google", "microsoft"]);

// Calendar connection stored in database
export const CalendarConnectionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  provider: CalendarProviderSchema,
  accountEmail: z.string().email(),
  accountName: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// Input for initiating OAuth connection
export const ConnectCalendarSchema = z.object({
  provider: CalendarProviderSchema,
  redirectUrl: z.string().url().optional(),
});

// OAuth callback input
export const CalendarOAuthCallbackSchema = z.object({
  provider: CalendarProviderSchema,
  code: z.string(),
  state: z.string().optional(),
});

// Calendar event schema
export const CalendarEventSchema = z.object({
  id: z.string(),
  calendarId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  location: z.string().nullable(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  isAllDay: z.boolean(),
  status: z.enum(["confirmed", "tentative", "cancelled"]),
  organizer: z
    .object({
      email: z.string().email(),
      name: z.string().nullable(),
    })
    .nullable(),
  attendees: z.array(
    z.object({
      email: z.string().email(),
      name: z.string().nullable(),
      responseStatus: z.enum(["accepted", "declined", "tentative", "needsAction"]),
    })
  ),
  htmlLink: z.string().url().nullable(),
});

// List events query
export const ListCalendarEventsSchema = z.object({
  connectionId: z.string().uuid(),
  calendarId: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  maxResults: z.number().min(1).max(100).optional().default(50),
});

// Calendar info schema
export const CalendarInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isPrimary: z.boolean(),
  accessRole: z.enum(["owner", "writer", "reader", "freeBusyReader"]),
  backgroundColor: z.string().nullable(),
});

// List calendars query
export const ListCalendarsSchema = z.object({
  connectionId: z.string().uuid(),
});

// OAuth URL response
export const OAuthUrlResponseSchema = z.object({
  url: z.string().url(),
  state: z.string(),
});

// Disconnect calendar input
export const DisconnectCalendarSchema = z.object({
  connectionId: z.string().uuid(),
});

// Export types
export type CalendarProvider = z.infer<typeof CalendarProviderSchema>;
export type CalendarConnection = z.infer<typeof CalendarConnectionSchema>;
export type ConnectCalendar = z.infer<typeof ConnectCalendarSchema>;
export type CalendarOAuthCallback = z.infer<typeof CalendarOAuthCallbackSchema>;
export type CalendarEvent = z.infer<typeof CalendarEventSchema>;
export type ListCalendarEvents = z.infer<typeof ListCalendarEventsSchema>;
export type CalendarInfo = z.infer<typeof CalendarInfoSchema>;
export type ListCalendars = z.infer<typeof ListCalendarsSchema>;
export type OAuthUrlResponse = z.infer<typeof OAuthUrlResponseSchema>;
export type DisconnectCalendar = z.infer<typeof DisconnectCalendarSchema>;
