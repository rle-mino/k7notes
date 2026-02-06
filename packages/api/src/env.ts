import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  // Server
  PORT: z.coerce.number().int().positive(),
  BASE_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),

  // Google OAuth (auth login)
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),

  // Calendar
  USE_CALENDAR_MOCKS: z
    .enum(["true", "false"])
    .transform((v) => v === "true"),
  GOOGLE_CALENDAR_CLIENT_ID: z.string().min(1),
  GOOGLE_CALENDAR_CLIENT_SECRET: z.string().min(1),
  MICROSOFT_CALENDAR_CLIENT_ID: z.string().min(1),
  MICROSOFT_CALENDAR_CLIENT_SECRET: z.string().min(1),

  // Transcription (optional — feature degrades gracefully)
  OPENAI_API_KEY: z.string().min(1).optional(),
});

export const env = envSchema.parse(process.env);
