import { pgTable, pgEnum, text, timestamp, uuid, boolean, real, jsonb, unique, AnyPgColumn } from "drizzle-orm/pg-core";

// ============================================================================
// Better-auth tables
// These tables are required by better-auth for authentication functionality
// ============================================================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// ============================================================================
// App-specific tables
// ============================================================================

// Health check table for database connectivity verification
export const healthCheck = pgTable("health_check", {
  id: uuid("id").defaultRandom().primaryKey(),
  status: text("status").notNull().default("ok"),
  checkedAt: timestamp("checked_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Folders table for organizing notes
export const folders = pgTable("folders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  parentId: uuid("parent_id").references((): AnyPgColumn => folders.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Transcriptions table for storing speech-to-text results
export const transcriptions = pgTable("transcriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  /** Provider used (e.g. "openai") */
  provider: text("provider").notNull(),
  /** User-editable title for the transcription */
  title: text("title"),
  /** Full transcribed text */
  text: text("text").notNull(),
  /** Diarized segments as JSON array */
  segments: jsonb("segments").notNull().default([]),
  /** Audio duration in seconds */
  durationSeconds: real("duration_seconds").notNull(),
  /** Detected or requested language */
  language: text("language"),
  /** Provider-specific metadata */
  metadata: jsonb("metadata"),
  /** The note created from this transcription, if any */
  noteId: uuid("note_id").references(() => notes.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Note kind enum
export const noteKindEnum = pgEnum("note_kind", ["REGULAR", "DAILY"]);

// Notes table for storing user notes
export const notes = pgTable("notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  kind: noteKindEnum("kind").notNull().default("REGULAR"),
  date: text("date"), // ISO date YYYY-MM-DD, used for daily notes
  folderId: uuid("folder_id").references(() => folders.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  unique("notes_user_kind_date_unique").on(table.userId, table.kind, table.date),
]);

// User preferences table for app/transcription language settings
export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().unique().references(() => user.id, { onDelete: "cascade" }),
  appLanguage: text("app_language").notNull().default("en"),
  transcriptionLanguage: text("transcription_language"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Calendar connections table for external calendar integrations
export const calendarConnections = pgTable("calendar_connections", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // 'google' | 'microsoft'
  accountEmail: text("account_email").notNull(),
  accountName: text("account_name"),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
