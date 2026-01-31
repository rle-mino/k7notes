import { All, Controller, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.config";

/**
 * Auth controller that proxies all /api/auth/* requests to better-auth.
 *
 * better-auth handles its own routing internally, so we use a catch-all
 * route and pass the request to the better-auth node handler.
 */
@Controller("api/auth")
export class AuthController {
  private readonly handler = toNodeHandler(auth);

  @All("*")
  async handleAuth(@Req() req: Request, @Res() res: Response) {
    // better-auth's node handler takes raw Node.js request/response
    return this.handler(req, res);
  }
}
