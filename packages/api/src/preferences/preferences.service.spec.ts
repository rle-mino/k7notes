import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import type { Database } from "../db/db.types.js";
import { userPreferences } from "../db/schema.js";
import { eq } from "drizzle-orm";
import {
  createTestDb,
  type TestContext,
} from "../../test/create-test-module.js";
import { createTestUser, cleanupDb } from "../../test/helpers.js";
import { PreferencesService } from "./preferences.service.js";

describe("PreferencesService", () => {
  let testContext: TestContext;
  let service: PreferencesService;
  let db: Database;

  let userA: { id: string };

  beforeAll(async () => {
    testContext = createTestDb();
    db = testContext.db;
    service = new PreferencesService(db);
  });

  beforeEach(async () => {
    await cleanupDb(db);
    userA = await createTestUser(db);
  });

  afterAll(async () => {
    await testContext.pool.end();
  });

  // ---------------------------------------------------------------------------
  // getOrCreate
  // ---------------------------------------------------------------------------
  describe("getOrCreate", () => {
    it("should create preferences with default 'en' for new user", async () => {
      const prefs = await service.getOrCreate(userA.id);

      expect(prefs.appLanguage).toBe("en");
      expect(prefs.transcriptionLanguage).toBeNull();
      expect(prefs.id).toBeDefined();
    });

    it("should create with 'fr' when deviceLanguage is 'fr'", async () => {
      const prefs = await service.getOrCreate(userA.id, "fr");

      expect(prefs.appLanguage).toBe("fr");
    });

    it("should default to 'en' for unsupported deviceLanguage", async () => {
      const prefs = await service.getOrCreate(userA.id, "de");

      expect(prefs.appLanguage).toBe("en");
    });

    it("should return existing row on second call (idempotent)", async () => {
      const first = await service.getOrCreate(userA.id, "fr");
      const second = await service.getOrCreate(userA.id);

      expect(second.id).toBe(first.id);
      expect(second.appLanguage).toBe("fr");
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------
  describe("update", () => {
    it("should change appLanguage", async () => {
      await service.getOrCreate(userA.id);
      const updated = await service.update(userA.id, { appLanguage: "fr" });

      expect(updated.appLanguage).toBe("fr");
    });

    it("should set transcriptionLanguage", async () => {
      await service.getOrCreate(userA.id);
      const updated = await service.update(userA.id, {
        transcriptionLanguage: "fr",
      });

      expect(updated.transcriptionLanguage).toBe("fr");
    });

    it("should clear transcriptionLanguage back to null", async () => {
      await service.getOrCreate(userA.id);
      await service.update(userA.id, { transcriptionLanguage: "fr" });
      const updated = await service.update(userA.id, {
        transcriptionLanguage: null,
      });

      expect(updated.transcriptionLanguage).toBeNull();
    });

    it("should auto-create row if none exists", async () => {
      // No getOrCreate call first
      const updated = await service.update(userA.id, { appLanguage: "fr" });

      expect(updated.appLanguage).toBe("fr");
      expect(updated.id).toBeDefined();
    });

    it("should update the updatedAt timestamp", async () => {
      await service.getOrCreate(userA.id);

      // Small delay to ensure timestamp difference
      await new Promise((r) => setTimeout(r, 50));

      await service.update(userA.id, { appLanguage: "fr" });

      const [row] = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userA.id));

      expect(row!.updatedAt.getTime()).toBeGreaterThan(
        row!.createdAt.getTime(),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // User isolation
  // ---------------------------------------------------------------------------
  describe("user isolation", () => {
    it("should give each user their own preferences", async () => {
      const userB = await createTestUser(db);

      await service.getOrCreate(userA.id, "fr");
      await service.getOrCreate(userB.id, "en");

      const prefsA = await service.getOrCreate(userA.id);
      const prefsB = await service.getOrCreate(userB.id);

      expect(prefsA.appLanguage).toBe("fr");
      expect(prefsB.appLanguage).toBe("en");
      expect(prefsA.id).not.toBe(prefsB.id);
    });

    it("should not affect other users when updating", async () => {
      const userB = await createTestUser(db);

      await service.getOrCreate(userA.id, "en");
      await service.getOrCreate(userB.id, "en");

      await service.update(userA.id, { appLanguage: "fr" });

      const prefsB = await service.getOrCreate(userB.id);
      expect(prefsB.appLanguage).toBe("en");
    });
  });
});
