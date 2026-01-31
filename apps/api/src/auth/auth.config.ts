import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { expo } from "@better-auth/expo";
import { db } from "../db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  baseURL: process.env.BASE_URL || "http://localhost:3000",
  basePath: "/api/auth",
  trustedOrigins: [
    "k7notes://", // App deep link scheme
    "exp://", // Expo dev scheme
    "http://localhost:8081", // Expo web
    "http://localhost:19006", // Expo web alt
  ],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Simplify for v1
  },
  plugins: [expo()],
});

export type Auth = typeof auth;
