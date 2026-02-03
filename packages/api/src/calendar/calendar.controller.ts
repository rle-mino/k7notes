import { Controller, UseGuards, Get, Query, Res, Logger } from "@nestjs/common";
import type { Response } from "express";
import { Implement, implement } from "@orpc/nest";
import { contract } from "@k7notes/contracts";
import { AuthGuard, AuthenticatedRequest } from "../auth/auth.guard.js";
import { CalendarService } from "./calendar.service.js";

// TODO: Add rate limiting to OAuth endpoints to prevent abuse
// Consider using @nestjs/throttler with configuration like:
// - OAuth callback: 10 requests per minute per IP
// - Token exchange: 5 requests per minute per user

@Controller()
export class CalendarController {
  private readonly logger = new Logger(CalendarController.name);

  constructor(private readonly calendarService: CalendarService) {}

  /**
   * Parse the state parameter to extract provider, platform, and userId
   * State format: "provider:platform:userId:uuid" (e.g., "google:mobile:user123:abc-123-def")
   */
  private parseState(state: string): { provider: string; platform: "mobile" | "web"; userId: string; stateId: string } | null {
    if (!state) return null;
    const parts = state.split(":");
    if (parts.length < 4) return null;
    const provider = parts[0];
    const platform = parts[1];
    const userId = parts[2];
    const stateId = parts.slice(3).join(":");
    if (!provider || !platform || !userId || !stateId) return null;
    if (platform !== "mobile" && platform !== "web") return null;
    return { provider, platform, userId, stateId };
  }

  /**
   * OAuth callback endpoint - receives GET redirect from Google/Microsoft
   * This endpoint doesn't require auth since the user is coming back from OAuth provider
   *
   * For mobile: redirects to app deep link (k7notes://calendar/callback)
   * For web: redirects to frontend callback page (http://localhost:4001/calendar/callback)
   *
   * The platform is encoded in the state parameter (format: "provider:platform:uuid")
   */
  @Get("api/calendar/oauth/callback")
  async oauthCallback(
    @Query("code") code: string,
    @Query("state") state: string,
    @Query("error") error: string | undefined,
    @Res() res: Response
  ) {
    const mobileScheme = "k7notes";
    const webCallbackUrl = "http://localhost:4001/calendar/callback";

    // Parse state to determine platform (mobile vs web)
    const parsedState = this.parseState(state);
    const isMobile = parsedState?.platform === "mobile";

    // Handle OAuth errors
    if (error) {
      this.logger.error(`OAuth error: ${error}`);
      const errorParam = `error=${encodeURIComponent(error)}`;
      if (isMobile) {
        return res.redirect(`${mobileScheme}://calendar/callback?${errorParam}`);
      }
      return res.redirect(`${webCallbackUrl}?${errorParam}`);
    }

    if (!code || !state) {
      this.logger.error("Missing code or state in OAuth callback");
      const errorParam = `error=${encodeURIComponent("Missing authorization code")}`;
      if (isMobile) {
        return res.redirect(`${mobileScheme}://calendar/callback?${errorParam}`);
      }
      return res.redirect(`${webCallbackUrl}?${errorParam}`);
    }

    // Build redirect URL with code and state
    const params = `code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;

    if (isMobile) {
      // Redirect to mobile app deep link
      const redirectUrl = `${mobileScheme}://calendar/callback?${params}`;
      this.logger.log("Redirecting OAuth callback to mobile app");
      return res.redirect(redirectUrl);
    }

    // Redirect to web callback
    const redirectUrl = `${webCallbackUrl}?${params}`;
    this.logger.log("Redirecting OAuth callback to web app");
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
