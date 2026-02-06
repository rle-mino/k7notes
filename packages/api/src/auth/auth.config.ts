import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { expo } from "@better-auth/expo";
import { db } from "../db/index.js";
import { env } from "../env.js";
import { FoldersService } from "../folders/folders.service.js";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  baseURL: env.BASE_URL,
  basePath: "/api/auth",
  trustedOrigins: [
    "k7notes://", // App deep link scheme
    "exp://", // Expo dev scheme
    "http://localhost:4001", // Expo web
    "http://localhost:19006", // Expo web alt
    "https://*.ngrok-free.dev", // ngrok tunnels for real device testing
  ],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Simplify for v1
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      // Request offline access to get refresh tokens
      accessType: "offline",
      // Always show account picker
      prompt: "select_account",
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            const foldersService = new FoldersService();
            await foldersService.createDefaultFolders(user.id);
          } catch (error) {
            console.error(
              "[auth] Failed to create default folders for user:",
              user.id,
              error,
            );
          }
        },
      },
    },
  },
  plugins: [expo()],
});

export type Auth = typeof auth;
