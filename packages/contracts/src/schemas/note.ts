import { z } from "zod";

export const NoteSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  title: z.string(),
  content: z.string(),
  folderId: z.string().uuid().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreateNoteSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
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

export type Note = z.infer<typeof NoteSchema>;
export type CreateNote = z.infer<typeof CreateNoteSchema>;
export type UpdateNote = z.infer<typeof UpdateNoteSchema>;
export type ListNotesQuery = z.infer<typeof ListNotesQuerySchema>;
export type SearchNotes = z.infer<typeof SearchNotesSchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
