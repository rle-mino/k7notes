import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { auth } from "./auth.config";

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    name: string;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
}

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    console.log('[AuthGuard] Checking auth for request');

    // Get session from better-auth
    // Convert Express headers to Headers object for better-auth
    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers)) {
      if (value) {
        headers.set(key, Array.isArray(value) ? value.join(", ") : value);
      }
    }

    try {
      const session = await auth.api.getSession({
        headers,
      });

      console.log('[AuthGuard] Session result:', session ? 'found' : 'not found', session?.user?.id);

      if (!session || !session.user) {
        throw new UnauthorizedException("Not authenticated");
      }

      // Attach user and session to request for use in controllers
      (request as AuthenticatedRequest).user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      };
      (request as AuthenticatedRequest).session = {
        id: session.session.id,
        userId: session.session.userId,
        expiresAt: session.session.expiresAt,
      };

      return true;
    } catch (error) {
      console.error('[AuthGuard] Error checking auth:', error);
      throw error;
    }
  }
}
