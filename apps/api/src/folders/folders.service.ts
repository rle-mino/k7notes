import { Injectable, NotFoundException } from "@nestjs/common";
import { eq, and, desc, isNull, asc } from "drizzle-orm";
import { db } from "../db";
import { folders, notes } from "../db/schema";

export interface CreateFolderDto {
  name: string;
  parentId?: string | null;
}

export interface UpdateFolderDto {
  name?: string;
  parentId?: string | null;
}

export interface Folder {
  id: string;
  userId: string;
  name: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  folderId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FolderContents {
  folders: Folder[];
  notes: Note[];
}

export interface FolderPathItem {
  id: string;
  name: string;
}

@Injectable()
export class FoldersService {
  async create(userId: string, dto: CreateFolderDto): Promise<Folder> {
    // If parentId is provided, verify it exists and belongs to user
    if (dto.parentId) {
      await this.findOne(userId, dto.parentId);
    }

    const result = await db
      .insert(folders)
      .values({
        userId,
        name: dto.name,
        parentId: dto.parentId ?? null,
      })
      .returning();

    const folder = result[0];
    if (!folder) {
      throw new Error("Failed to create folder");
    }

    return folder;
  }

  async findOne(userId: string, id: string): Promise<Folder> {
    const [folder] = await db
      .select()
      .from(folders)
      .where(and(eq(folders.id, id), eq(folders.userId, userId)))
      .limit(1);

    if (!folder) {
      throw new NotFoundException("Folder not found");
    }

    return folder;
  }

  async findAll(userId: string, parentId?: string | null): Promise<Folder[]> {
    if (parentId === undefined) {
      // Return all folders for user
      return db
        .select()
        .from(folders)
        .where(eq(folders.userId, userId))
        .orderBy(asc(folders.name));
    }

    if (parentId === null) {
      // Return root folders (no parent)
      return db
        .select()
        .from(folders)
        .where(and(eq(folders.userId, userId), isNull(folders.parentId)))
        .orderBy(asc(folders.name));
    }

    // Return subfolders of specific folder
    return db
      .select()
      .from(folders)
      .where(and(eq(folders.userId, userId), eq(folders.parentId, parentId)))
      .orderBy(asc(folders.name));
  }

  async update(userId: string, id: string, dto: UpdateFolderDto): Promise<Folder> {
    // First verify the folder exists and belongs to user
    await this.findOne(userId, id);

    // If updating parentId, verify the new parent exists and belongs to user
    if (dto.parentId) {
      await this.findOne(userId, dto.parentId);
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (dto.name !== undefined) {
      updateData.name = dto.name;
    }
    if (dto.parentId !== undefined) {
      updateData.parentId = dto.parentId;
    }

    const result = await db
      .update(folders)
      .set(updateData)
      .where(and(eq(folders.id, id), eq(folders.userId, userId)))
      .returning();

    const updated = result[0];
    if (!updated) {
      throw new NotFoundException("Folder not found");
    }

    return updated;
  }

  async delete(userId: string, id: string): Promise<void> {
    // First verify the folder exists and belongs to user
    await this.findOne(userId, id);

    // Delete folder (cascade will handle subfolders, notes will have folderId set to null)
    await db
      .delete(folders)
      .where(and(eq(folders.id, id), eq(folders.userId, userId)));
  }

  async getContents(userId: string, folderId: string | null): Promise<FolderContents> {
    // Get subfolders and notes in parallel
    const [subfolders, folderNotes] = await Promise.all([
      folderId === null
        ? db
            .select()
            .from(folders)
            .where(and(eq(folders.userId, userId), isNull(folders.parentId)))
            .orderBy(asc(folders.name))
        : db
            .select()
            .from(folders)
            .where(and(eq(folders.userId, userId), eq(folders.parentId, folderId)))
            .orderBy(asc(folders.name)),
      folderId === null
        ? db
            .select()
            .from(notes)
            .where(and(eq(notes.userId, userId), isNull(notes.folderId)))
            .orderBy(desc(notes.updatedAt))
        : db
            .select()
            .from(notes)
            .where(and(eq(notes.userId, userId), eq(notes.folderId, folderId)))
            .orderBy(desc(notes.updatedAt)),
    ]);

    return {
      folders: subfolders,
      notes: folderNotes,
    };
  }

  async getPath(userId: string, folderId: string): Promise<FolderPathItem[]> {
    const path: FolderPathItem[] = [];
    let currentId: string | null = folderId;

    // Walk up the folder tree
    while (currentId) {
      const folder = await this.findOne(userId, currentId);
      path.unshift({ id: folder.id, name: folder.name });
      currentId = folder.parentId;
    }

    return path;
  }
}
