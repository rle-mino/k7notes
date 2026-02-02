import { oc } from "@orpc/contract";
import { z } from "zod";
import {
  CalendarConnectionSchema,
  ConnectCalendarSchema,
  CalendarOAuthCallbackSchema,
  CalendarEventSchema,
  ListCalendarEventsSchema,
  CalendarInfoSchema,
  ListCalendarsSchema,
  OAuthUrlResponseSchema,
  DisconnectCalendarSchema,
} from "../schemas/calendar";
import { IdParamSchema, SuccessResponseSchema } from "../schemas/common";

export const calendarContract = {
  // List all connected calendars for the user
  listConnections: oc
    .route({ method: "GET", path: "/api/calendar/connections" })
    .output(z.array(CalendarConnectionSchema)),

  // Get OAuth URL to initiate calendar connection
  getOAuthUrl: oc
    .route({ method: "POST", path: "/api/calendar/connect" })
    .input(ConnectCalendarSchema)
    .output(OAuthUrlResponseSchema),

  // Handle OAuth callback
  handleOAuthCallback: oc
    .route({ method: "POST", path: "/api/calendar/callback" })
    .input(CalendarOAuthCallbackSchema)
    .output(CalendarConnectionSchema),

  // Disconnect a calendar
  disconnect: oc
    .route({ method: "DELETE", path: "/api/calendar/connections/{connectionId}" })
    .input(z.object({ connectionId: z.string().uuid() }))
    .output(SuccessResponseSchema),

  // List calendars from a connected account
  listCalendars: oc
    .route({ method: "GET", path: "/api/calendar/connections/{connectionId}/calendars" })
    .input(ListCalendarsSchema)
    .output(z.array(CalendarInfoSchema)),

  // List events from a calendar
  listEvents: oc
    .route({ method: "POST", path: "/api/calendar/events" })
    .input(ListCalendarEventsSchema)
    .output(z.array(CalendarEventSchema)),
};
