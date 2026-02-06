import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "./schema.js";

export const DB_TOKEN = Symbol("DB_TOKEN");

export type Database = NodePgDatabase<typeof schema>;
