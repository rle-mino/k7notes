import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import * as schema from './schema';

// Import migration SQL files (babel-plugin-inline-import converts to string)
import migration0001 from './migrations/0001_initial.sql';
import migration0002 from './migrations/0002_fts5.sql';
import migration0003 from './migrations/0003_sync.sql';

// Database instances - initialized async
let expoDb: SQLiteDatabase | null = null;
let drizzleDb: ExpoSQLiteDatabase<typeof schema> | null = null;

// Initialize database asynchronously (required for web support)
export async function initDatabase(): Promise<void> {
  if (expoDb) return; // Already initialized

  expoDb = await openDatabaseAsync('k7notes.db', { enableChangeListener: true });
  drizzleDb = drizzle(expoDb, { schema });

  // Create migration tracking table
  await expoDb.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY NOT NULL,
      applied_at INTEGER NOT NULL
    );
  `);

  // Bootstrap: If schema_migrations is empty but tables exist, populate it
  // This handles databases created before migration tracking was added
  const migrationCount = await expoDb.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM schema_migrations'
  );

  console.log('[DB] Migration count in tracking table:', migrationCount?.count);

  if (migrationCount?.count === 0) {
    console.log('[DB] Empty migration table, checking for existing schema...');

    // Check if notes table exists (indicates 0001 was run)
    const notesExists = await expoDb.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='notes'"
    );
    console.log('[DB] Notes table exists:', !!notesExists);
    if (notesExists) {
      console.log('[DB] Bootstrapping: marking 0001_initial as applied');
      await expoDb.runAsync(
        'INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (?, ?)',
        ['0001_initial', Date.now()]
      );
    }

    // Check if notes_fts table exists (indicates 0002 was run)
    const ftsExists = await expoDb.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='notes_fts'"
    );
    console.log('[DB] FTS table exists:', !!ftsExists);
    if (ftsExists) {
      console.log('[DB] Bootstrapping: marking 0002_fts5 as applied');
      await expoDb.runAsync(
        'INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (?, ?)',
        ['0002_fts5', Date.now()]
      );
    }

    // Check if sync_status column exists on notes (indicates 0003 was run)
    const columns = await expoDb.getAllAsync<{ name: string }>(
      "PRAGMA table_info(notes)"
    );
    console.log('[DB] Notes columns:', columns.map(c => c.name));
    const hasSyncStatus = columns.some(col => col.name === 'sync_status');
    console.log('[DB] Has sync_status column:', hasSyncStatus);
    if (hasSyncStatus) {
      console.log('[DB] Bootstrapping: marking 0003_sync as applied');
      await expoDb.runAsync(
        'INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (?, ?)',
        ['0003_sync', Date.now()]
      );
    }
  }

  // Run migrations with tracking
  const migrations = [
    { version: '0001_initial', sql: migration0001 },
    { version: '0002_fts5', sql: migration0002 },
    { version: '0003_sync', sql: migration0003 },
  ];

  for (const migration of migrations) {
    // Check if already applied
    const result = await expoDb.getFirstAsync<{ version: string }>(
      'SELECT version FROM schema_migrations WHERE version = ?',
      [migration.version]
    );

    if (!result) {
      console.log(`[DB] Running migration: ${migration.version}`);
      await expoDb.execAsync(migration.sql);
      await expoDb.runAsync(
        'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)',
        [migration.version, Date.now()]
      );
    }
  }

  console.log('[DB] Database initialized and migrations complete');
}

// Get drizzle database instance
export function getDb(): ExpoSQLiteDatabase<typeof schema> {
  if (!drizzleDb) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return drizzleDb;
}

// Get expo sqlite instance
export function getExpo(): SQLiteDatabase {
  if (!expoDb) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return expoDb;
}

// Check if database is initialized
export function isDbInitialized(): boolean {
  return expoDb !== null && drizzleDb !== null;
}

// Lazy db accessor - throws if not initialized
// This allows importing `db` at module level while deferring actual access
export const db = new Proxy({} as ExpoSQLiteDatabase<typeof schema>, {
  get(_, prop) {
    if (!drizzleDb) {
      throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return (drizzleDb as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// Run migrations on app start (kept for backward compatibility, but initDatabase does this)
export async function runMigrations() {
  await initDatabase();
}
