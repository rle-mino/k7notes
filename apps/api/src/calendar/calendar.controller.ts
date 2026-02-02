import { Controller, UseGuards } from "@nestjs/common";
import { Implement, implement } from "@orpc/nest";
import { contract } from "@k7notes/contracts";
import { AuthGuard, AuthenticatedRequest } from "../auth/auth.guard.js";
import { CalendarService } from "./calendar.service.js";

@Controller()
@UseGuards(AuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Implement(contract.calendar.listConnections)
  listConnections() {
    return implement(contract.calendar.listConnections).handler(
      async ({ context }) => {
        const req = context.request as unknown as AuthenticatedRequest;
        return this.calendarService.listConnections(req.user.id);
      }
    );
  }

  @Implement(contract.calendar.getOAuthUrl)
  getOAuthUrl() {
    return implement(contract.calendar.getOAuthUrl).handler(
      async ({ input, context }) => {
        const req = context.request as unknown as AuthenticatedRequest;
        return this.calendarService.getOAuthUrl(
          req.user.id,
          input.provider,
          input.redirectUrl
        );
      }
    );
  }

  @Implement(contract.calendar.handleOAuthCallback)
  handleOAuthCallback() {
    return implement(contract.calendar.handleOAuthCallback).handler(
      async ({ input, context }) => {
        const req = context.request as unknown as AuthenticatedRequest;
        return this.calendarService.handleOAuthCallback(
          req.user.id,
          input.provider,
          input.code,
          input.state
        );
      }
    );
  }

  @Implement(contract.calendar.disconnect)
  disconnect() {
    return implement(contract.calendar.disconnect).handler(
      async ({ input, context }) => {
        const req = context.request as unknown as AuthenticatedRequest;
        await this.calendarService.disconnect(req.user.id, input.connectionId);
        return { success: true as const };
      }
    );
  }

  @Implement(contract.calendar.listCalendars)
  listCalendars() {
    return implement(contract.calendar.listCalendars).handler(
      async ({ input, context }) => {
        const req = context.request as unknown as AuthenticatedRequest;
        return this.calendarService.listCalendars(req.user.id, input.connectionId);
      }
    );
  }

  @Implement(contract.calendar.listEvents)
  listEvents() {
    return implement(contract.calendar.listEvents).handler(
      async ({ input, context }) => {
        const req = context.request as unknown as AuthenticatedRequest;
        return this.calendarService.listEvents(
          req.user.id,
          input.connectionId,
          input.calendarId,
          input.startDate,
          input.endDate,
          input.maxResults
        );
      }
    );
  }
}
