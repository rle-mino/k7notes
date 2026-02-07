import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { eq, and, desc, isNull, asc } from "drizzle-orm";
import { DB_TOKEN, type Database } from "../db/db.types.js";
import { folders, notes } from "../db/schema.js";

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
  kind: "REGULAR" | "DAILY";
  date: string | null;
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
  constructor(@Inject(DB_TOKEN) private readonly db: Database) {}

  async create(userId: string, dto: CreateFolderDto): Promise<Folder> {
    // If parentId is provided, verify it exists and belongs to user
    if (dto.parentId) {
      await this.findOne(userId, dto.parentId);
    }

    const result = await this.db
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
    const [folder] = await this.db
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
      return this.db
        .select()
        .from(folders)
        .where(eq(folders.userId, userId))
        .orderBy(asc(folders.name));
    }

    if (parentId === null) {
      // Return root folders (no parent)
      return this.db
        .select()
        .from(folders)
        .where(and(eq(folders.userId, userId), isNull(folders.parentId)))
        .orderBy(asc(folders.name));
    }

    // Return subfolders of specific folder
    return this.db
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

    const result = await this.db
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
    await this.db
      .delete(folders)
      .where(and(eq(folders.id, id), eq(folders.userId, userId)));
  }

  async getContents(userId: string, folderId: string | null): Promise<FolderContents> {
    // Get subfolders and notes in parallel
    const [subfolders, folderNotes] = await Promise.all([
      folderId === null
        ? this.db
            .select()
            .from(folders)
            .where(and(eq(folders.userId, userId), isNull(folders.parentId)))
            .orderBy(asc(folders.name))
        : this.db
            .select()
            .from(folders)
            .where(and(eq(folders.userId, userId), eq(folders.parentId, folderId)))
            .orderBy(asc(folders.name)),
      folderId === null
        ? this.db
            .select()
            .from(notes)
            .where(and(eq(notes.userId, userId), isNull(notes.folderId)))
            .orderBy(desc(notes.updatedAt))
        : this.db
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

  /**
   * Finds a folder by name within a specific parent (or at root level if parentId is null).
   * Returns the folder if found, or null if not.
   */
  async findByName(
    userId: string,
    name: string,
    parentId: string | null,
  ): Promise<Folder | null> {
    const condition =
      parentId === null
        ? and(
            eq(folders.userId, userId),
            eq(folders.name, name),
            isNull(folders.parentId),
          )
        : and(
            eq(folders.userId, userId),
            eq(folders.name, name),
            eq(folders.parentId, parentId),
          );

    const [folder] = await this.db
      .select()
      .from(folders)
      .where(condition)
      .limit(1);

    return folder ?? null;
  }

  /**
   * Walks a folder path (e.g. ["Daily", "2026", "01", "15"]) and creates any
   * missing folders along the way. Returns the leaf (deepest) folder.
   *
   * The first element is expected at the root level (parentId = null).
   */
  async findOrCreatePath(userId: string, path: string[]): Promise<Folder> {
    if (path.length === 0) {
      throw new Error("Path must not be empty");
    }

    let parentId: string | null = null;
    let current: Folder | null = null;

    for (const segment of path) {
      const existing = await this.findByName(userId, segment, parentId);

      if (existing) {
        current = existing;
      } else {
        current = await this.create(userId, { name: segment, parentId });
      }

      parentId = current.id;
    }

    // current is guaranteed non-null because path.length > 0
    return current!;
  }

  async createDefaultFolders(userId: string): Promise<Folder[]> {
    const defaultFolderNames = ["Daily", "People", "Projects", "Archive"];

    const result = await this.db
      .insert(folders)
      .values(
        defaultFolderNames.map((name) => ({
          userId,
          name,
          parentId: null,
        })),
      )
      .returning();

    return result;
  }
}
