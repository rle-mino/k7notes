import { eq, desc, isNull } from 'drizzle-orm';
import { db } from '../client';
import { notes, Note, NewNote } from '../schema';

// Generate UUID for new records
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Create a new note
 */
export async function createNote(data: {
  title: string;
  content?: string;
  folderId?: string | null;
}): Promise<Note> {
  const now = new Date();
  const newNote: NewNote = {
    id: generateId(),
    title: data.title,
    content: data.content ?? '',
    folderId: data.folderId ?? null,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(notes).values(newNote);
  return {
    id: newNote.id,
    title: newNote.title,
    content: newNote.content ?? '',
    folderId: newNote.folderId ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Get a note by ID
 */
export async function getNote(id: string): Promise<Note | null> {
  const results = await db.select().from(notes).where(eq(notes.id, id)).limit(1);
  return results[0] ?? null;
}

/**
 * List notes in a folder (or root if folderId is null)
 * Ordered by updatedAt descending (most recent first)
 */
export async function listNotes(folderId: string | null = null): Promise<Note[]> {
  if (folderId === null) {
    return db
      .select()
      .from(notes)
      .where(isNull(notes.folderId))
      .orderBy(desc(notes.updatedAt));
  }
  return db
    .select()
    .from(notes)
    .where(eq(notes.folderId, folderId))
    .orderBy(desc(notes.updatedAt));
}

/**
 * List all notes (for search purposes)
 */
export async function listAllNotes(): Promise<Note[]> {
  return db.select().from(notes).orderBy(desc(notes.updatedAt));
}

/**
 * Update a note
 */
export async function updateNote(
  id: string,
  data: Partial<Pick<Note, 'title' | 'content' | 'folderId'>>
): Promise<Note | null> {
  const now = new Date();
  await db
    .update(notes)
    .set({ ...data, updatedAt: now })
    .where(eq(notes.id, id));
  return getNote(id);
}

/**
 * Delete a note
 */
export async function deleteNote(id: string): Promise<void> {
  await db.delete(notes).where(eq(notes.id, id));
}

/**
 * Move a note to a different folder
 */
export async function moveNote(id: string, folderId: string | null): Promise<Note | null> {
  return updateNote(id, { folderId });
}
