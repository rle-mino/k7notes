import { expo } from '../client';
import { Note } from '../schema';

/**
 * Search result with relevance score
 */
export interface SearchResult {
  note: Note;
  rank: number;
  snippet: string;
}

/**
 * Search notes using FTS5 full-text search
 * Returns results ranked by bm25 relevance score
 *
 * @param query - Search query string (supports FTS5 syntax: AND, OR, quotes for phrases)
 * @param limit - Maximum results to return (default 50)
 */
export async function searchNotes(query: string, limit = 50): Promise<SearchResult[]> {
  if (!query.trim()) {
    return [];
  }

  // Escape special FTS5 characters and add wildcards for prefix matching
  // This allows partial word matching (e.g., "meet" matches "meeting")
  const searchTerms = query
    .trim()
    .split(/\s+/)
    .map((term) => `"${term}"*`)
    .join(' ');

  // Use raw SQL for FTS5 query with bm25 ranking
  // Join with notes table to get full note data
  const results = expo.getAllSync<{
    id: string;
    title: string;
    content: string;
    folder_id: string | null;
    created_at: number;
    updated_at: number;
    rank: number;
    snippet: string;
  }>(
    `
    SELECT
      notes.id,
      notes.title,
      notes.content,
      notes.folder_id,
      notes.created_at,
      notes.updated_at,
      bm25(notes_fts) as rank,
      snippet(notes_fts, 1, '<mark>', '</mark>', '...', 32) as snippet
    FROM notes_fts
    JOIN notes ON notes.rowid = notes_fts.rowid
    WHERE notes_fts MATCH ?
    ORDER BY rank
    LIMIT ?
    `,
    [searchTerms, limit]
  );

  return results.map((row) => ({
    note: {
      id: row.id,
      title: row.title,
      content: row.content,
      folderId: row.folder_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    },
    rank: row.rank,
    snippet: row.snippet,
  }));
}

/**
 * Rebuild the FTS index from scratch
 * Useful if index gets out of sync (should rarely be needed due to triggers)
 */
export async function rebuildSearchIndex(): Promise<void> {
  expo.execSync("INSERT INTO notes_fts(notes_fts) VALUES('rebuild')");
  console.log('[DB] FTS index rebuilt');
}
