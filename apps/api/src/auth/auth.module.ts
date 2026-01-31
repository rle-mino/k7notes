import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";

/**
 * Auth module that integrates better-auth with NestJS.
 *
 * Routes are handled at /api/auth/* by the AuthController,
 * which proxies requests to better-auth's node handler.
 */
@Module({
  controllers: [AuthController],
  exports: [],
})
export class AuthModule {}
