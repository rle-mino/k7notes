import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Health check table for database connectivity verification
export const healthCheck = pgTable("health_check", {
  id: uuid("id").defaultRandom().primaryKey(),
  status: text("status").notNull().default("ok"),
  checkedAt: timestamp("checked_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
