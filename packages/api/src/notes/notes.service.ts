import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { eq, and, desc, sql, isNull } from "drizzle-orm";
import { DB_TOKEN, type Database } from "../db/db.types.js";
import { notes } from "../db/schema.js";

export interface CreateNoteDto {
  title: string;
  content?: string;
  kind?: "REGULAR" | "DAILY";
  date?: string | null;
  folderId?: string | null;
}

export interface UpdateNoteDto {
  title?: string;
  content?: string;
  folderId?: string | null;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  kind: "REGULAR" | "DAILY";
  date: string | null;
  folderId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchResult {
  note: Note;
  rank: number;
  snippet: string;
}

@Injectable()
export class NotesService {
  constructor(@Inject(DB_TOKEN) private readonly db: Database) {}

  async create(userId: string, dto: CreateNoteDto): Promise<Note> {
    const result = await this.db
      .insert(notes)
      .values({
        userId,
        title: dto.title,
        content: dto.content ?? "",
        kind: dto.kind ?? "REGULAR",
        date: dto.date ?? null,
        folderId: dto.folderId ?? null,
      })
      .returning();

    const note = result[0];
    if (!note) {
      throw new Error("Failed to create note");
    }

    return note;
  }

  async findOne(userId: string, id: string): Promise<Note> {
    const [note] = await this.db
      .select()
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId)))
      .limit(1);

    if (!note) {
      throw new NotFoundException("Note not found");
    }

    return note;
  }

  async findAll(userId: string, folderId?: string | null): Promise<Note[]> {
    if (folderId === undefined) {
      // Return all notes for user
      return this.db
        .select()
        .from(notes)
        .where(eq(notes.userId, userId))
        .orderBy(desc(notes.updatedAt));
    }

    if (folderId === null) {
      // Return notes at root (no folder)
      return this.db
        .select()
        .from(notes)
        .where(and(eq(notes.userId, userId), isNull(notes.folderId)))
        .orderBy(desc(notes.updatedAt));
    }

    // Return notes in specific folder
    return this.db
      .select()
      .from(notes)
      .where(and(eq(notes.userId, userId), eq(notes.folderId, folderId)))
      .orderBy(desc(notes.updatedAt));
  }

  async update(userId: string, id: string, dto: UpdateNoteDto): Promise<Note> {
    // First verify the note exists and belongs to user
    await this.findOne(userId, id);

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (dto.title !== undefined) {
      updateData.title = dto.title;
    }
    if (dto.content !== undefined) {
      updateData.content = dto.content;
    }
    if (dto.folderId !== undefined) {
      updateData.folderId = dto.folderId;
    }

    const result = await this.db
      .update(notes)
      .set(updateData)
      .where(and(eq(notes.id, id), eq(notes.userId, userId)))
      .returning();

    const updated = result[0];
    if (!updated) {
      throw new NotFoundException("Note not found");
    }

    return updated;
  }

  async delete(userId: string, id: string): Promise<void> {
    // First verify the note exists and belongs to user
    await this.findOne(userId, id);

    await this.db
      .delete(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId)));
  }

  async findByKindAndDate(
    userId: string,
    kind: "REGULAR" | "DAILY",
    date: string,
  ): Promise<Note | null> {
    const [note] = await this.db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.userId, userId),
          eq(notes.kind, kind),
          eq(notes.date, date),
        ),
      )
      .limit(1);

    return note ?? null;
  }

  async search(userId: string, query: string): Promise<SearchResult[]> {
    // PostgreSQL full-text search using ts_vector
    const searchQuery = query
      .trim()
      .split(/\s+/)
      .filter((term) => term.length > 0)
      .map((term) => term + ":*")
      .join(" & ");

    if (!searchQuery) {
      return [];
    }

    const results = await this.db.execute(sql`
      SELECT
        id,
        user_id as "userId",
        title,
        content,
        kind,
        date,
        folder_id as "folderId",
        created_at as "createdAt",
        updated_at as "updatedAt",
        ts_rank(
          to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')),
          to_tsquery('english', ${searchQuery})
        ) as rank,
        ts_headline(
          'english',
          coalesce(title, '') || ' ' || coalesce(content, ''),
          to_tsquery('english', ${searchQuery}),
          'StartSel=**, StopSel=**, MaxWords=35, MinWords=15'
        ) as snippet
      FROM notes
      WHERE user_id = ${userId}
        AND to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
            @@ to_tsquery('english', ${searchQuery})
      ORDER BY rank DESC
      LIMIT 50
    `);

    return results.rows.map((row: Record<string, unknown>) => ({
      note: {
        id: row.id as string,
        userId: row.userId as string,
        title: row.title as string,
        content: row.content as string,
        kind: row.kind as "REGULAR" | "DAILY",
        date: row.date as string | null,
        folderId: row.folderId as string | null,
        createdAt: new Date(row.createdAt as string),
        updatedAt: new Date(row.updatedAt as string),
      },
      rank: row.rank as number,
      snippet: row.snippet as string,
    }));
  }
}
