import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

// Import migration SQL (babel-plugin-inline-import converts to string)
import migration0001 from './migrations/0001_initial.sql';

const expo = openDatabaseSync('k7notes.db', { enableChangeListener: true });

export const db = drizzle(expo, { schema });

// Run migrations on app start
export async function runMigrations() {
  // Simple migration runner - execute each migration SQL
  expo.execSync(migration0001);
  console.log('[DB] Migrations complete');
}

// Export raw expo-sqlite for useLiveQuery if needed
export { expo };
