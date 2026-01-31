import { sqliteTable, text, integer, AnySQLiteColumn } from 'drizzle-orm/sqlite-core';

// Folders use adjacency list pattern for nesting (parent_id FK)
export const folders = sqliteTable('folders', {
  id: text('id').primaryKey(), // UUID
  name: text('name').notNull(),
  parentId: text('parent_id').references((): AnySQLiteColumn => folders.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Notes belong to folders (nullable for root-level notes)
export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(), // UUID
  title: text('title').notNull(),
  content: text('content').notNull().default(''), // Stored as markdown
  folderId: text('folder_id').references(() => folders.id, { onDelete: 'set null' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Type exports for use in queries
export type Folder = typeof folders.$inferSelect;
export type NewFolder = typeof folders.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
