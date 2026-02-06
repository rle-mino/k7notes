import { NotFoundException } from "@nestjs/common";
import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import type { Database } from "../db/db.types.js";
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
import { NotesService } from "./notes.service.js";

describe("NotesService", () => {
  let testContext: TestContext;
  let service: NotesService;
  let db: Database;

  let userA: { id: string };
  let userB: { id: string };

  beforeAll(async () => {
    testContext = createTestDb();
    db = testContext.db;
    service = new NotesService(testContext.db);
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
    it("should create a note and return it with an id", async () => {
      const note = await service.create(userA.id, { title: "My Note" });

      expect(note).toBeDefined();
      expect(note.id).toBeDefined();
      expect(note.userId).toBe(userA.id);
      expect(note.title).toBe("My Note");
      expect(note.createdAt).toBeInstanceOf(Date);
      expect(note.updatedAt).toBeInstanceOf(Date);
    });

    it("should default content to empty string when not provided", async () => {
      const note = await service.create(userA.id, { title: "Empty" });

      expect(note.content).toBe("");
    });

    it("should default folderId to null when not provided", async () => {
      const note = await service.create(userA.id, { title: "Root Note" });

      expect(note.folderId).toBeNull();
    });

    it("should set content and folderId when provided", async () => {
      const folder = await createTestFolder(db, userA.id);
      const note = await service.create(userA.id, {
        title: "In Folder",
        content: "<p>Hello</p>",
        folderId: folder.id,
      });

      expect(note.content).toBe("<p>Hello</p>");
      expect(note.folderId).toBe(folder.id);
    });
  });

  // ---------------------------------------------------------------------------
  // findOne
  // ---------------------------------------------------------------------------
  describe("findOne", () => {
    it("should return a note for the correct user", async () => {
      const created = await createTestNote(db, userA.id, {
        title: "Find Me",
      });
      const found = await service.findOne(userA.id, created.id);

      expect(found.id).toBe(created.id);
      expect(found.title).toBe("Find Me");
    });

    it("should throw NotFoundException when note does not exist", async () => {
      await expect(
        service.findOne(userA.id, "00000000-0000-0000-0000-000000000000"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException when note belongs to a different user", async () => {
      const note = await createTestNote(db, userA.id);

      await expect(service.findOne(userB.id, note.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // findAll
  // ---------------------------------------------------------------------------
  describe("findAll", () => {
    it("should return all notes for a user when folderId is undefined", async () => {
      await createTestNote(db, userA.id, { title: "Note 1" });
      await createTestNote(db, userA.id, { title: "Note 2" });
      await createTestNote(db, userB.id, { title: "Other" });

      const results = await service.findAll(userA.id);

      expect(results).toHaveLength(2);
      expect(results.map((n) => n.title)).toContain("Note 1");
      expect(results.map((n) => n.title)).toContain("Note 2");
    });

    it("should filter by folderId when provided", async () => {
      const folder = await createTestFolder(db, userA.id);
      await createTestNote(db, userA.id, {
        title: "In Folder",
        folderId: folder.id,
      });
      await createTestNote(db, userA.id, { title: "At Root" });

      const results = await service.findAll(userA.id, folder.id);

      expect(results).toHaveLength(1);
      expect(results[0]!.title).toBe("In Folder");
    });

    it("should return root notes when folderId is null", async () => {
      const folder = await createTestFolder(db, userA.id);
      await createTestNote(db, userA.id, {
        title: "In Folder",
        folderId: folder.id,
      });
      await createTestNote(db, userA.id, { title: "At Root" });

      const results = await service.findAll(userA.id, null);

      expect(results).toHaveLength(1);
      expect(results[0]!.title).toBe("At Root");
    });

    it("should return notes ordered by updatedAt descending", async () => {
      await createTestNote(db, userA.id, { title: "Second" });
      // Small delay to guarantee distinct timestamps
      await new Promise((r) => setTimeout(r, 50));
      const note1 = await createTestNote(db, userA.id, { title: "First" });
      // Update note1 so it has a newer updatedAt
      await service.update(userA.id, note1.id, { title: "First Updated" });

      const results = await service.findAll(userA.id);

      // note1 was updated after note2 was created, so it should appear first
      expect(results[0]!.title).toBe("First Updated");
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------
  describe("update", () => {
    it("should update title", async () => {
      const note = await createTestNote(db, userA.id, {
        title: "Original",
      });

      const updated = await service.update(userA.id, note.id, {
        title: "Renamed",
      });

      expect(updated.title).toBe("Renamed");
      expect(updated.content).toBe(note.content);
    });

    it("should update content", async () => {
      const note = await createTestNote(db, userA.id);

      const updated = await service.update(userA.id, note.id, {
        content: "New content",
      });

      expect(updated.content).toBe("New content");
    });

    it("should update folderId", async () => {
      const folder = await createTestFolder(db, userA.id);
      const note = await createTestNote(db, userA.id);

      const updated = await service.update(userA.id, note.id, {
        folderId: folder.id,
      });

      expect(updated.folderId).toBe(folder.id);
    });

    it("should move note back to root by setting folderId to null", async () => {
      const folder = await createTestFolder(db, userA.id);
      const note = await createTestNote(db, userA.id, {
        folderId: folder.id,
      });

      const updated = await service.update(userA.id, note.id, {
        folderId: null,
      });

      expect(updated.folderId).toBeNull();
    });

    it("should update updatedAt timestamp", async () => {
      const note = await createTestNote(db, userA.id);

      const updated = await service.update(userA.id, note.id, {
        title: "Changed",
      });

      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        note.updatedAt.getTime(),
      );
    });

    it("should throw NotFoundException when updating another user's note", async () => {
      const note = await createTestNote(db, userA.id);

      await expect(
        service.update(userB.id, note.id, { title: "Hijack" }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // delete
  // ---------------------------------------------------------------------------
  describe("delete", () => {
    it("should delete a note", async () => {
      const note = await createTestNote(db, userA.id);

      await service.delete(userA.id, note.id);

      await expect(service.findOne(userA.id, note.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFoundException when deleting another user's note", async () => {
      const note = await createTestNote(db, userA.id);

      await expect(service.delete(userB.id, note.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFoundException when note does not exist", async () => {
      await expect(
        service.delete(userA.id, "00000000-0000-0000-0000-000000000000"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // search
  // ---------------------------------------------------------------------------
  describe("search", () => {
    it("should return empty array for empty query", async () => {
      await createTestNote(db, userA.id, { title: "Anything" });

      const results = await service.search(userA.id, "");

      expect(results).toEqual([]);
    });

    it("should return empty array for whitespace-only query", async () => {
      await createTestNote(db, userA.id, { title: "Anything" });

      const results = await service.search(userA.id, "   ");

      expect(results).toEqual([]);
    });

    it("should find notes matching by title", async () => {
      await createTestNote(db, userA.id, {
        title: "PostgreSQL Performance Tuning",
        content: "Some basic content",
      });
      await createTestNote(db, userA.id, {
        title: "Unrelated Topic",
        content: "Nothing here",
      });

      const results = await service.search(userA.id, "PostgreSQL");

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0]!.note.title).toBe("PostgreSQL Performance Tuning");
      expect(results[0]!.rank).toBeGreaterThan(0);
      expect(results[0]!.snippet).toBeDefined();
    });

    it("should find notes matching by content", async () => {
      await createTestNote(db, userA.id, {
        title: "Untitled",
        content: "The architecture of distributed systems is fascinating",
      });

      const results = await service.search(userA.id, "distributed");

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0]!.note.content).toContain("distributed");
    });

    it("should support partial matching via prefix search", async () => {
      await createTestNote(db, userA.id, {
        title: "Programming Languages Overview",
        content: "Various programming paradigms",
      });

      // The service appends `:*` to each term for prefix matching
      const results = await service.search(userA.id, "program");

      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it("should rank results by relevance", async () => {
      await createTestNote(db, userA.id, {
        title: "Algorithms and Data Structures",
        content: "Algorithms are fundamental to computer science. Algorithms drive everything.",
      });
      await createTestNote(db, userA.id, {
        title: "Cooking Recipes",
        content: "This has nothing about algorithms at all except this one mention of algorithms.",
      });

      const results = await service.search(userA.id, "algorithms");

      expect(results.length).toBe(2);
      // The note with "algorithms" in both title and content should rank higher
      expect(results[0]!.note.title).toBe("Algorithms and Data Structures");
    });

    it("should not return notes belonging to other users", async () => {
      await createTestNote(db, userA.id, {
        title: "Secret Research Notes",
        content: "Top secret quantum computing research",
      });
      await createTestNote(db, userB.id, {
        title: "Quantum Physics Notes",
        content: "Another quantum topic",
      });

      const resultsA = await service.search(userA.id, "quantum");
      const resultsB = await service.search(userB.id, "quantum");

      expect(resultsA).toHaveLength(1);
      expect(resultsA[0]!.note.userId).toBe(userA.id);

      expect(resultsB).toHaveLength(1);
      expect(resultsB[0]!.note.userId).toBe(userB.id);
    });
  });

  // ---------------------------------------------------------------------------
  // User isolation
  // ---------------------------------------------------------------------------
  describe("user isolation", () => {
    it("user A cannot read user B's notes via findOne", async () => {
      const note = await createTestNote(db, userB.id, {
        title: "Private",
      });

      await expect(service.findOne(userA.id, note.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("user A cannot see user B's notes in findAll", async () => {
      await createTestNote(db, userA.id, { title: "A Note" });
      await createTestNote(db, userB.id, { title: "B Note" });

      const results = await service.findAll(userA.id);

      expect(results).toHaveLength(1);
      expect(results[0]!.title).toBe("A Note");
    });

    it("user A cannot update user B's note", async () => {
      const note = await createTestNote(db, userB.id);

      await expect(
        service.update(userA.id, note.id, { title: "Tampered" }),
      ).rejects.toThrow(NotFoundException);

      // Verify the note is unchanged
      const unchanged = await service.findOne(userB.id, note.id);
      expect(unchanged.title).toBe("Test Note");
    });

    it("user A cannot delete user B's note", async () => {
      const note = await createTestNote(db, userB.id);

      await expect(service.delete(userA.id, note.id)).rejects.toThrow(
        NotFoundException,
      );

      // Verify the note still exists
      const still = await service.findOne(userB.id, note.id);
      expect(still.id).toBe(note.id);
    });
  });
});
