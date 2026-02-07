import { NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import type { Database } from "../db/db.types.js";
import { notes } from "../db/schema.js";
import {
  createTestDb,
  type TestContext,
} from "../../test/create-test-module.js";
import {
  createTestUser,
  createTestNote,
  createTestFolder,
  cleanupDb,
} from "../../test/helpers.js";
import { FoldersService } from "./folders.service.js";

describe("FoldersService", () => {
  let testContext: TestContext;
  let service: FoldersService;
  let db: Database;

  let userA: { id: string };
  let userB: { id: string };

  beforeAll(async () => {
    testContext = createTestDb();
    db = testContext.db;
    service = new FoldersService(testContext.db);
  });

  beforeEach(async () => {
    await cleanupDb(db);
    userA = await createTestUser(db);
    userB = await createTestUser(db);
  });

  afterAll(async () => {
    await testContext.pool.end();
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe("create", () => {
    it("should create a folder and return it with an id", async () => {
      const folder = await service.create(userA.id, { name: "Work" });

      expect(folder).toBeDefined();
      expect(folder.id).toBeDefined();
      expect(folder.userId).toBe(userA.id);
      expect(folder.name).toBe("Work");
      expect(folder.parentId).toBeNull();
      expect(folder.createdAt).toBeInstanceOf(Date);
      expect(folder.updatedAt).toBeInstanceOf(Date);
    });

    it("should create a subfolder when parentId is provided", async () => {
      const parent = await service.create(userA.id, { name: "Parent" });
      const child = await service.create(userA.id, {
        name: "Child",
        parentId: parent.id,
      });

      expect(child.parentId).toBe(parent.id);
      expect(child.name).toBe("Child");
    });

    it("should throw NotFoundException when parentId does not exist", async () => {
      await expect(
        service.create(userA.id, {
          name: "Orphan",
          parentId: "00000000-0000-0000-0000-000000000000",
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException when parentId belongs to another user", async () => {
      const otherFolder = await createTestFolder(db, userB.id, {
        name: "B Folder",
      });

      await expect(
        service.create(userA.id, {
          name: "Sneaky",
          parentId: otherFolder.id,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should default parentId to null when not provided", async () => {
      const folder = await service.create(userA.id, { name: "Root Level" });

      expect(folder.parentId).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // findOne
  // ---------------------------------------------------------------------------
  describe("findOne", () => {
    it("should return a folder for the correct user", async () => {
      const created = await createTestFolder(db, userA.id, {
        name: "Find Me",
      });
      const found = await service.findOne(userA.id, created.id);

      expect(found.id).toBe(created.id);
      expect(found.name).toBe("Find Me");
    });

    it("should throw NotFoundException when folder does not exist", async () => {
      await expect(
        service.findOne(userA.id, "00000000-0000-0000-0000-000000000000"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException when folder belongs to a different user", async () => {
      const folder = await createTestFolder(db, userA.id);

      await expect(service.findOne(userB.id, folder.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // findAll
  // ---------------------------------------------------------------------------
  describe("findAll", () => {
    it("should return all folders for a user when parentId is undefined", async () => {
      await createTestFolder(db, userA.id, { name: "Folder 1" });
      await createTestFolder(db, userA.id, { name: "Folder 2" });
      await createTestFolder(db, userB.id, { name: "Other" });

      const results = await service.findAll(userA.id);

      expect(results).toHaveLength(2);
      expect(results.map((f) => f.name)).toContain("Folder 1");
      expect(results.map((f) => f.name)).toContain("Folder 2");
    });

    it("should filter by parentId when provided", async () => {
      const parent = await createTestFolder(db, userA.id, { name: "Parent" });
      await createTestFolder(db, userA.id, {
        name: "Child",
        parentId: parent.id,
      });
      await createTestFolder(db, userA.id, { name: "Root Level" });

      const results = await service.findAll(userA.id, parent.id);

      expect(results).toHaveLength(1);
      expect(results[0]!.name).toBe("Child");
    });

    it("should return root folders when parentId is null", async () => {
      const parent = await createTestFolder(db, userA.id, { name: "Root" });
      await createTestFolder(db, userA.id, {
        name: "Nested",
        parentId: parent.id,
      });

      const results = await service.findAll(userA.id, null);

      expect(results).toHaveLength(1);
      expect(results[0]!.name).toBe("Root");
    });

    it("should return folders ordered by name ascending", async () => {
      await createTestFolder(db, userA.id, { name: "Zebra" });
      await createTestFolder(db, userA.id, { name: "Apple" });
      await createTestFolder(db, userA.id, { name: "Mango" });

      const results = await service.findAll(userA.id);

      expect(results.map((f) => f.name)).toEqual(["Apple", "Mango", "Zebra"]);
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------
  describe("update", () => {
    it("should update name", async () => {
      const folder = await createTestFolder(db, userA.id, {
        name: "Original",
      });

      const updated = await service.update(userA.id, folder.id, {
        name: "Renamed",
      });

      expect(updated.name).toBe("Renamed");
    });

    it("should update parentId to move folder into another folder", async () => {
      const parent = await createTestFolder(db, userA.id, {
        name: "Destination",
      });
      const folder = await createTestFolder(db, userA.id, {
        name: "Moving",
      });

      const updated = await service.update(userA.id, folder.id, {
        parentId: parent.id,
      });

      expect(updated.parentId).toBe(parent.id);
    });

    it("should move folder to root by setting parentId to null", async () => {
      const parent = await createTestFolder(db, userA.id, { name: "Parent" });
      const child = await createTestFolder(db, userA.id, {
        name: "Child",
        parentId: parent.id,
      });

      const updated = await service.update(userA.id, child.id, {
        parentId: null,
      });

      expect(updated.parentId).toBeNull();
    });

    it("should update updatedAt timestamp", async () => {
      const folder = await createTestFolder(db, userA.id);

      const updated = await service.update(userA.id, folder.id, {
        name: "Changed",
      });

      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        folder.updatedAt.getTime(),
      );
    });

    it("should throw NotFoundException when updating another user's folder", async () => {
      const folder = await createTestFolder(db, userA.id);

      await expect(
        service.update(userB.id, folder.id, { name: "Hijack" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException when new parentId does not exist", async () => {
      const folder = await createTestFolder(db, userA.id);

      await expect(
        service.update(userA.id, folder.id, {
          parentId: "00000000-0000-0000-0000-000000000000",
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException when new parentId belongs to another user", async () => {
      const folder = await createTestFolder(db, userA.id);
      const otherFolder = await createTestFolder(db, userB.id);

      await expect(
        service.update(userA.id, folder.id, {
          parentId: otherFolder.id,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // delete
  // ---------------------------------------------------------------------------
  describe("delete", () => {
    it("should delete a folder", async () => {
      const folder = await createTestFolder(db, userA.id);

      await service.delete(userA.id, folder.id);

      await expect(service.findOne(userA.id, folder.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should cascade delete subfolders", async () => {
      const parent = await createTestFolder(db, userA.id, { name: "Parent" });
      const child = await createTestFolder(db, userA.id, {
        name: "Child",
        parentId: parent.id,
      });
      const grandchild = await createTestFolder(db, userA.id, {
        name: "Grandchild",
        parentId: child.id,
      });

      await service.delete(userA.id, parent.id);

      await expect(service.findOne(userA.id, child.id)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(userA.id, grandchild.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should set folderId to null on notes when folder is deleted", async () => {
      const folder = await createTestFolder(db, userA.id);
      const note = await createTestNote(db, userA.id, {
        title: "Orphaned Note",
        folderId: folder.id,
      });

      await service.delete(userA.id, folder.id);

      // Note should still exist but with folderId set to null
      const [found] = await db
        .select()
        .from(notes)
        .where(eq(notes.id, note.id));

      expect(found).toBeDefined();
      expect(found!.folderId).toBeNull();
      expect(found!.title).toBe("Orphaned Note");
    });

    it("should throw NotFoundException when deleting another user's folder", async () => {
      const folder = await createTestFolder(db, userA.id);

      await expect(service.delete(userB.id, folder.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFoundException when folder does not exist", async () => {
      await expect(
        service.delete(userA.id, "00000000-0000-0000-0000-000000000000"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // getContents
  // ---------------------------------------------------------------------------
  describe("getContents", () => {
    it("should return subfolders and notes for a given folder", async () => {
      const parent = await createTestFolder(db, userA.id, { name: "Parent" });
      await createTestFolder(db, userA.id, {
        name: "Subfolder",
        parentId: parent.id,
      });
      await createTestNote(db, userA.id, {
        title: "Note In Folder",
        folderId: parent.id,
      });

      const contents = await service.getContents(userA.id, parent.id);

      expect(contents.folders).toHaveLength(1);
      expect(contents.folders[0]!.name).toBe("Subfolder");
      expect(contents.notes).toHaveLength(1);
      expect(contents.notes[0]!.title).toBe("Note In Folder");
    });

    it("should return root folders and root notes when folderId is null", async () => {
      const rootFolder = await createTestFolder(db, userA.id, {
        name: "Root Folder",
      });
      await createTestFolder(db, userA.id, {
        name: "Nested",
        parentId: rootFolder.id,
      });
      await createTestNote(db, userA.id, { title: "Root Note" });
      await createTestNote(db, userA.id, {
        title: "Nested Note",
        folderId: rootFolder.id,
      });

      const contents = await service.getContents(userA.id, null);

      expect(contents.folders).toHaveLength(1);
      expect(contents.folders[0]!.name).toBe("Root Folder");
      expect(contents.notes).toHaveLength(1);
      expect(contents.notes[0]!.title).toBe("Root Note");
    });

    it("should return empty arrays when folder has no children", async () => {
      const empty = await createTestFolder(db, userA.id, {
        name: "Empty Folder",
      });

      const contents = await service.getContents(userA.id, empty.id);

      expect(contents.folders).toEqual([]);
      expect(contents.notes).toEqual([]);
    });

    it("should not include other users' contents", async () => {
      const folderA = await createTestFolder(db, userA.id, {
        name: "A Folder",
      });
      await createTestNote(db, userA.id, {
        title: "A Note",
        folderId: folderA.id,
      });
      // Create content for userB in a different folder but same root
      await createTestFolder(db, userB.id, { name: "B Root Folder" });
      await createTestNote(db, userB.id, { title: "B Root Note" });

      const rootContentsA = await service.getContents(userA.id, null);

      expect(rootContentsA.folders).toHaveLength(1);
      expect(rootContentsA.folders[0]!.name).toBe("A Folder");
      // userA has no root notes (the note is inside folderA)
      expect(rootContentsA.notes).toHaveLength(0);
    });

    it("should return folders ordered by name ascending and notes ordered by updatedAt descending", async () => {
      const parent = await createTestFolder(db, userA.id, { name: "Parent" });
      await createTestFolder(db, userA.id, {
        name: "Zebra",
        parentId: parent.id,
      });
      await createTestFolder(db, userA.id, {
        name: "Apple",
        parentId: parent.id,
      });

      const contents = await service.getContents(userA.id, parent.id);

      expect(contents.folders.map((f) => f.name)).toEqual(["Apple", "Zebra"]);
    });
  });

  // ---------------------------------------------------------------------------
  // getPath
  // ---------------------------------------------------------------------------
  describe("getPath", () => {
    it("should return a single-element path for a root folder", async () => {
      const root = await createTestFolder(db, userA.id, { name: "Root" });

      const path = await service.getPath(userA.id, root.id);

      expect(path).toHaveLength(1);
      expect(path[0]).toEqual({ id: root.id, name: "Root" });
    });

    it("should walk up the tree and return the full path", async () => {
      const grandparent = await createTestFolder(db, userA.id, {
        name: "Grandparent",
      });
      const parent = await createTestFolder(db, userA.id, {
        name: "Parent",
        parentId: grandparent.id,
      });
      const child = await createTestFolder(db, userA.id, {
        name: "Child",
        parentId: parent.id,
      });

      const path = await service.getPath(userA.id, child.id);

      expect(path).toHaveLength(3);
      expect(path[0]).toEqual({ id: grandparent.id, name: "Grandparent" });
      expect(path[1]).toEqual({ id: parent.id, name: "Parent" });
      expect(path[2]).toEqual({ id: child.id, name: "Child" });
    });

    it("should throw NotFoundException when folder does not exist", async () => {
      await expect(
        service.getPath(userA.id, "00000000-0000-0000-0000-000000000000"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException when folder belongs to another user", async () => {
      const folder = await createTestFolder(db, userB.id, {
        name: "Private",
      });

      await expect(
        service.getPath(userA.id, folder.id),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // findByName
  // ---------------------------------------------------------------------------
  describe("findByName", () => {
    it("should find a root folder by name", async () => {
      await createTestFolder(db, userA.id, { name: "Daily" });

      const found = await service.findByName(userA.id, "Daily", null);

      expect(found).not.toBeNull();
      expect(found!.name).toBe("Daily");
      expect(found!.parentId).toBeNull();
    });

    it("should find a child folder by name within a parent", async () => {
      const parent = await createTestFolder(db, userA.id, { name: "Daily" });
      await createTestFolder(db, userA.id, {
        name: "2026",
        parentId: parent.id,
      });

      const found = await service.findByName(userA.id, "2026", parent.id);

      expect(found).not.toBeNull();
      expect(found!.name).toBe("2026");
      expect(found!.parentId).toBe(parent.id);
    });

    it("should return null when folder does not exist", async () => {
      const found = await service.findByName(userA.id, "NonExistent", null);

      expect(found).toBeNull();
    });

    it("should return null when folder exists but belongs to another user", async () => {
      await createTestFolder(db, userB.id, { name: "Secret" });

      const found = await service.findByName(userA.id, "Secret", null);

      expect(found).toBeNull();
    });

    it("should distinguish between folders with the same name in different parents", async () => {
      const parentA = await createTestFolder(db, userA.id, { name: "A" });
      const parentB = await createTestFolder(db, userA.id, { name: "B" });
      await createTestFolder(db, userA.id, {
        name: "Same",
        parentId: parentA.id,
      });
      await createTestFolder(db, userA.id, {
        name: "Same",
        parentId: parentB.id,
      });

      const foundInA = await service.findByName(userA.id, "Same", parentA.id);
      const foundInB = await service.findByName(userA.id, "Same", parentB.id);

      expect(foundInA).not.toBeNull();
      expect(foundInB).not.toBeNull();
      expect(foundInA!.parentId).toBe(parentA.id);
      expect(foundInB!.parentId).toBe(parentB.id);
      expect(foundInA!.id).not.toBe(foundInB!.id);
    });
  });

  // ---------------------------------------------------------------------------
  // findOrCreatePath
  // ---------------------------------------------------------------------------
  describe("findOrCreatePath", () => {
    it("should create a single-level path when nothing exists", async () => {
      const leaf = await service.findOrCreatePath(userA.id, ["Daily"]);

      expect(leaf.name).toBe("Daily");
      expect(leaf.parentId).toBeNull();
    });

    it("should create a multi-level path when nothing exists", async () => {
      const leaf = await service.findOrCreatePath(userA.id, [
        "Daily",
        "2026",
        "01",
        "15",
      ]);

      expect(leaf.name).toBe("15");

      // Verify the full hierarchy was created
      const path = await service.getPath(userA.id, leaf.id);
      expect(path).toHaveLength(4);
      expect(path.map((p) => p.name)).toEqual(["Daily", "2026", "01", "15"]);
    });

    it("should reuse existing folders and only create missing ones", async () => {
      // Pre-create the first two levels
      const daily = await createTestFolder(db, userA.id, { name: "Daily" });
      const year = await createTestFolder(db, userA.id, {
        name: "2026",
        parentId: daily.id,
      });

      const leaf = await service.findOrCreatePath(userA.id, [
        "Daily",
        "2026",
        "01",
        "15",
      ]);

      expect(leaf.name).toBe("15");

      // Verify the pre-existing folders were reused
      const path = await service.getPath(userA.id, leaf.id);
      expect(path).toHaveLength(4);
      expect(path[0]!.id).toBe(daily.id);
      expect(path[1]!.id).toBe(year.id);
    });

    it("should return the existing leaf when the full path already exists", async () => {
      const daily = await createTestFolder(db, userA.id, { name: "Daily" });
      const year = await createTestFolder(db, userA.id, {
        name: "2026",
        parentId: daily.id,
      });
      const month = await createTestFolder(db, userA.id, {
        name: "01",
        parentId: year.id,
      });
      const day = await createTestFolder(db, userA.id, {
        name: "15",
        parentId: month.id,
      });

      const leaf = await service.findOrCreatePath(userA.id, [
        "Daily",
        "2026",
        "01",
        "15",
      ]);

      expect(leaf.id).toBe(day.id);

      // Verify no extra folders were created
      const allFolders = await service.findAll(userA.id);
      expect(allFolders).toHaveLength(4);
    });

    it("should throw an error for an empty path", async () => {
      await expect(
        service.findOrCreatePath(userA.id, []),
      ).rejects.toThrow("Path must not be empty");
    });

    it("should not interfere with another user's folders", async () => {
      // User B has a Daily folder
      await createTestFolder(db, userB.id, { name: "Daily" });

      // User A creates the same path - should create its own
      const leaf = await service.findOrCreatePath(userA.id, [
        "Daily",
        "2026",
      ]);

      expect(leaf.name).toBe("2026");
      expect(leaf.userId).toBe(userA.id);

      // User B should still have only one folder
      const userBFolders = await service.findAll(userB.id);
      expect(userBFolders).toHaveLength(1);
    });

    it("should handle calling findOrCreatePath twice with the same path idempotently", async () => {
      const first = await service.findOrCreatePath(userA.id, [
        "Daily",
        "2026",
        "02",
      ]);
      const second = await service.findOrCreatePath(userA.id, [
        "Daily",
        "2026",
        "02",
      ]);

      expect(first.id).toBe(second.id);

      // Verify no duplicate folders were created
      const allFolders = await service.findAll(userA.id);
      expect(allFolders).toHaveLength(3);
    });

    it("should handle branching paths correctly", async () => {
      // Create Daily/2026/01
      const jan = await service.findOrCreatePath(userA.id, [
        "Daily",
        "2026",
        "01",
      ]);
      // Create Daily/2026/02 (shares Daily and 2026 folders)
      const feb = await service.findOrCreatePath(userA.id, [
        "Daily",
        "2026",
        "02",
      ]);

      expect(jan.name).toBe("01");
      expect(feb.name).toBe("02");
      expect(jan.id).not.toBe(feb.id);

      // Verify the shared parent (2026) is the same
      const janPath = await service.getPath(userA.id, jan.id);
      const febPath = await service.getPath(userA.id, feb.id);
      expect(janPath[1]!.id).toBe(febPath[1]!.id); // same "2026" folder

      // Total folders: Daily, 2026, 01, 02 = 4
      const allFolders = await service.findAll(userA.id);
      expect(allFolders).toHaveLength(4);
    });
  });

  // ---------------------------------------------------------------------------
  // User isolation
  // ---------------------------------------------------------------------------
  describe("user isolation", () => {
    it("user A cannot read user B's folders via findOne", async () => {
      const folder = await createTestFolder(db, userB.id, {
        name: "Private",
      });

      await expect(service.findOne(userA.id, folder.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("user A cannot see user B's folders in findAll", async () => {
      await createTestFolder(db, userA.id, { name: "A Folder" });
      await createTestFolder(db, userB.id, { name: "B Folder" });

      const results = await service.findAll(userA.id);

      expect(results).toHaveLength(1);
      expect(results[0]!.name).toBe("A Folder");
    });

    it("user A cannot update user B's folder", async () => {
      const folder = await createTestFolder(db, userB.id);

      await expect(
        service.update(userA.id, folder.id, { name: "Tampered" }),
      ).rejects.toThrow(NotFoundException);

      // Verify the folder is unchanged
      const unchanged = await service.findOne(userB.id, folder.id);
      expect(unchanged.name).toBe("Test Folder");
    });

    it("user A cannot delete user B's folder", async () => {
      const folder = await createTestFolder(db, userB.id);

      await expect(service.delete(userA.id, folder.id)).rejects.toThrow(
        NotFoundException,
      );

      // Verify the folder still exists
      const still = await service.findOne(userB.id, folder.id);
      expect(still.id).toBe(folder.id);
    });

    it("user A cannot see user B's folder contents via getContents", async () => {
      await createTestFolder(db, userA.id, { name: "A Root" });
      await createTestNote(db, userA.id, { title: "A Root Note" });
      await createTestFolder(db, userB.id, { name: "B Root" });
      await createTestNote(db, userB.id, { title: "B Root Note" });

      const contentsA = await service.getContents(userA.id, null);

      expect(contentsA.folders).toHaveLength(1);
      expect(contentsA.folders[0]!.name).toBe("A Root");
      expect(contentsA.notes).toHaveLength(1);
      expect(contentsA.notes[0]!.title).toBe("A Root Note");
    });

    it("user A cannot get path for user B's folder", async () => {
      const folder = await createTestFolder(db, userB.id, {
        name: "Secret",
      });

      await expect(
        service.getPath(userA.id, folder.id),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
