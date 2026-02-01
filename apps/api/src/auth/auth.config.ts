import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { expo } from "@better-auth/expo";
import { db } from "../db/index.js";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  baseURL: process.env.BASE_URL || "http://localhost:4000",
  basePath: "/api/auth",
  trustedOrigins: [
    "k7notes://", // App deep link scheme
    "exp://", // Expo dev scheme
    "http://localhost:4001", // Expo web
    "http://localhost:19006", // Expo web alt
  ],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Simplify for v1
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      // Request offline access to get refresh tokens
      accessType: "offline",
      // Always show account picker
      prompt: "select_account",
    },
  },
  plugins: [expo()],
});

export type Auth = typeof auth;
