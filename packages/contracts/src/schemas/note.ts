import { z } from "zod";

export const NoteKindSchema = z.enum(["REGULAR", "DAILY"]);

export const NoteSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  title: z.string(),
  content: z.string(),
  kind: NoteKindSchema,
  date: z.string().nullable(), // ISO date YYYY-MM-DD, used for daily notes
  folderId: z.string().uuid().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreateNoteSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  kind: NoteKindSchema.optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").nullable().optional(),
  folderId: z.string().uuid().nullable().optional(),
});

export const UpdateNoteSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  folderId: z.string().uuid().nullable().optional(),
});

export const ListNotesQuerySchema = z.object({
  folderId: z.string().uuid().nullable().optional(),
});

export const SearchNotesSchema = z.object({
  q: z.string().min(1),
});

export const SearchResultSchema = z.object({
  note: NoteSchema,
  rank: z.number(),
  snippet: z.string(),
});

export type NoteKind = z.infer<typeof NoteKindSchema>;
export type Note = z.infer<typeof NoteSchema>;
export type CreateNote = z.infer<typeof CreateNoteSchema>;
export type UpdateNote = z.infer<typeof UpdateNoteSchema>;
export type ListNotesQuery = z.infer<typeof ListNotesQuerySchema>;
export type SearchNotes = z.infer<typeof SearchNotesSchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;

// Daily notes schemas
export const GetOrCreateDailyNoteSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});

export const RefreshDailyNoteEventsSchema = z.object({
  noteId: z.string().uuid(),
});

export type GetOrCreateDailyNote = z.infer<typeof GetOrCreateDailyNoteSchema>;
export type RefreshDailyNoteEvents = z.infer<typeof RefreshDailyNoteEventsSchema>;
