import { z } from "zod";
import { NoteSchema } from "./note";

export const FolderSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  name: z.string(),
  parentId: z.string().uuid().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreateFolderSchema = z.object({
  name: z.string().min(1),
  parentId: z.string().uuid().nullable().optional(),
});

export const UpdateFolderSchema = z.object({
  name: z.string().min(1).optional(),
  parentId: z.string().uuid().nullable().optional(),
});

export const ListFoldersQuerySchema = z.object({
  parentId: z.string().uuid().nullable().optional(),
});

export const FolderContentsQuerySchema = z.object({
  folderId: z.string().uuid().nullable().optional(),
});

export const FolderContentsResponseSchema = z.object({
  folders: z.array(FolderSchema),
  notes: z.array(NoteSchema),
});

export const FolderPathItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export type Folder = z.infer<typeof FolderSchema>;
export type CreateFolder = z.infer<typeof CreateFolderSchema>;
export type UpdateFolder = z.infer<typeof UpdateFolderSchema>;
export type ListFoldersQuery = z.infer<typeof ListFoldersQuerySchema>;
export type FolderContentsQuery = z.infer<typeof FolderContentsQuerySchema>;
export type FolderContentsResponse = z.infer<typeof FolderContentsResponseSchema>;
export type FolderPathItem = z.infer<typeof FolderPathItemSchema>;
