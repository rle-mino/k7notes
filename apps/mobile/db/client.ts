import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

// Import migration SQL files (babel-plugin-inline-import converts to string)
import migration0001 from './migrations/0001_initial.sql';
import migration0002 from './migrations/0002_fts5.sql';

const expo = openDatabaseSync('k7notes.db', { enableChangeListener: true });

export const db = drizzle(expo, { schema });

// Run migrations on app start
export async function runMigrations() {
  // Run migrations in order
  // Each migration is idempotent (IF NOT EXISTS)
  expo.execSync(migration0001);
  expo.execSync(migration0002);
  console.log('[DB] Migrations complete');
}

// Export raw expo-sqlite for useLiveQuery if needed
export { expo };
