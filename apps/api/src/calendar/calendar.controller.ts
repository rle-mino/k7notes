import { Controller, UseGuards, Get, Query, Res, Logger } from "@nestjs/common";
import type { Response } from "express";
import { Implement, implement } from "@orpc/nest";
import { contract } from "@k7notes/contracts";
import { AuthGuard, AuthenticatedRequest } from "../auth/auth.guard.js";
import { CalendarService } from "./calendar.service.js";

@Controller()
export class CalendarController {
  private readonly logger = new Logger(CalendarController.name);

  constructor(private readonly calendarService: CalendarService) {}

  /**
   * OAuth callback endpoint - receives GET redirect from Google/Microsoft
   * This endpoint doesn't require auth since the user is coming back from OAuth provider
   *
   * For mobile: redirects to app deep link (k7notes://calendar/callback)
   * For web: redirects to frontend callback page (http://localhost:4001/calendar/callback)
   */
  @Get("api/calendar/oauth/callback")
  async oauthCallback(
    @Query("code") code: string,
    @Query("state") state: string,
    @Query("error") error: string | undefined,
    @Res() res: Response
  ) {
    const mobileScheme = process.env.MOBILE_DEEP_LINK_SCHEME || "k7notes";
    const webCallbackUrl =
      process.env.WEB_OAUTH_CALLBACK_URL || "http://localhost:4001/calendar/callback";

    // Determine if this is likely a web or mobile request
    // For now, use web callback for local development
    const useWebCallback = process.env.NODE_ENV !== "production" || process.env.USE_WEB_OAUTH_CALLBACK === "true";

    // Handle OAuth errors
    if (error) {
      this.logger.error(`OAuth error: ${error}`);
      const errorParam = `error=${encodeURIComponent(error)}`;
      if (useWebCallback) {
        return res.redirect(`${webCallbackUrl}?${errorParam}`);
      }
      return res.redirect(`${mobileScheme}://calendar/callback?${errorParam}`);
    }

    if (!code || !state) {
      this.logger.error("Missing code or state in OAuth callback");
      const errorParam = `error=${encodeURIComponent("Missing authorization code")}`;
      if (useWebCallback) {
        return res.redirect(`${webCallbackUrl}?${errorParam}`);
      }
      return res.redirect(`${mobileScheme}://calendar/callback?${errorParam}`);
    }

    // Build redirect URL with code and state
    const params = `code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;

    if (useWebCallback) {
      const redirectUrl = `${webCallbackUrl}?${params}`;
      this.logger.log(`Redirecting to web callback: ${redirectUrl}`);
      return res.redirect(redirectUrl);
    }

    // Redirect to mobile app with the code and state
    // The mobile app will then call the handleOAuthCallback endpoint with auth
    const redirectUrl = `${mobileScheme}://calendar/callback?${params}`;
    this.logger.log(`Redirecting to mobile: ${redirectUrl}`);
    return res.redirect(redirectUrl);
  }

  @UseGuards(AuthGuard)
  @Implement(contract.calendar.listConnections)
  listConnections() {
    return implement(contract.calendar.listConnections).handler(
      async ({ context }) => {
        const req = context.request as unknown as AuthenticatedRequest;
        return this.calendarService.listConnections(req.user.id);
      }
    );
  }

  @UseGuards(AuthGuard)
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

  @UseGuards(AuthGuard)
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

  @UseGuards(AuthGuard)
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

  @UseGuards(AuthGuard)
  @Implement(contract.calendar.listCalendars)
  listCalendars() {
    return implement(contract.calendar.listCalendars).handler(
      async ({ input, context }) => {
        const req = context.request as unknown as AuthenticatedRequest;
        return this.calendarService.listCalendars(req.user.id, input.connectionId);
      }
    );
  }

  @UseGuards(AuthGuard)
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
