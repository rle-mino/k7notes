import { eq, isNull, desc } from 'drizzle-orm';
import { db } from '../client';
import { folders, notes, Folder, NewFolder, Note } from '../schema';

// Generate UUID for new records
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Create a new folder
 */
export async function createFolder(data: {
  name: string;
  parentId?: string | null;
}): Promise<Folder> {
  const now = new Date();
  const newFolder: NewFolder = {
    id: generateId(),
    name: data.name,
    parentId: data.parentId ?? null,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(folders).values(newFolder);
  return {
    id: newFolder.id,
    name: newFolder.name,
    parentId: newFolder.parentId ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Get a folder by ID
 */
export async function getFolder(id: string): Promise<Folder | null> {
  const results = await db.select().from(folders).where(eq(folders.id, id)).limit(1);
  return results[0] ?? null;
}

/**
 * List folders in a parent folder (or root if parentId is null)
 */
export async function listFolders(parentId: string | null = null): Promise<Folder[]> {
  if (parentId === null) {
    return db
      .select()
      .from(folders)
      .where(isNull(folders.parentId))
      .orderBy(folders.name);
  }
  return db
    .select()
    .from(folders)
    .where(eq(folders.parentId, parentId))
    .orderBy(folders.name);
}

/**
 * List all folders (for move dialog, folder picker)
 */
export async function listAllFolders(): Promise<Folder[]> {
  return db.select().from(folders).orderBy(folders.name);
}

/**
 * Update a folder
 */
export async function updateFolder(
  id: string,
  data: Partial<Pick<Folder, 'name' | 'parentId'>>
): Promise<Folder | null> {
  const now = new Date();
  await db
    .update(folders)
    .set({ ...data, updatedAt: now })
    .where(eq(folders.id, id));
  return getFolder(id);
}

/**
 * Delete a folder (cascades to subfolders, sets notes.folder_id to null)
 */
export async function deleteFolder(id: string): Promise<void> {
  await db.delete(folders).where(eq(folders.id, id));
}

/**
 * Get folder contents (subfolders and notes)
 * Returns both for display in folder view
 */
export async function getFolderContents(folderId: string | null): Promise<{
  folders: Folder[];
  notes: Note[];
}> {
  const [folderList, noteList] = await Promise.all([
    listFolders(folderId),
    folderId === null
      ? db.select().from(notes).where(isNull(notes.folderId)).orderBy(desc(notes.updatedAt))
      : db.select().from(notes).where(eq(notes.folderId, folderId)).orderBy(desc(notes.updatedAt)),
  ]);

  return { folders: folderList, notes: noteList };
}

/**
 * Get folder path (breadcrumb) from root to given folder
 * Uses recursive lookup (not CTE, for simplicity with small depth)
 */
export async function getFolderPath(folderId: string): Promise<Folder[]> {
  const path: Folder[] = [];
  let currentId: string | null = folderId;

  while (currentId) {
    const folder = await getFolder(currentId);
    if (!folder) break;
    path.unshift(folder); // Add to beginning for root-first order
    currentId = folder.parentId;
  }

  return path;
}
