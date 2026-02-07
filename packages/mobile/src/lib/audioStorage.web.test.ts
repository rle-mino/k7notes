/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import "fake-indexeddb/auto";

// Polyfill web APIs needed by the web storage module
import { Blob as NodeBlob } from "node:buffer";

if (typeof globalThis.Blob === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  globalThis.Blob = NodeBlob as any;
}
if (typeof globalThis.URL.createObjectURL === "undefined") {
  let counter = 0;
  globalThis.URL.createObjectURL = () => `blob:fake-${++counter}`;
}
if (typeof globalThis.atob === "undefined") {
  globalThis.atob = (s: string) =>
    Buffer.from(s, "base64").toString("binary");
}

import {
  getAudioDir,
  saveRecording,
  listRecordings,
  deleteRecording,
  getRecordingBase64,
} from "./audioStorage.web";

const DB_NAME = "k7notes_audio";
const STORE_NAME = "recordings";

/**
 * Clear all records without deleting the database.
 * deleteDatabase blocks if any connections are open, so we clear the store instead.
 */
async function clearStore(): Promise<void> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const d = req.result;
      if (!d.objectStoreNames.contains(STORE_NAME)) {
        d.createObjectStore(STORE_NAME, { keyPath: "fileName" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  db.close();
}

beforeEach(async () => {
  vi.restoreAllMocks();
  await clearStore();
});

describe("getAudioDir", () => {
  it("returns the virtual indexeddb path", () => {
    expect(getAudioDir()).toBe("indexeddb://audio/");
  });
});

describe("saveRecording", () => {
  it("saves a recording and returns fileUri and fileName", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1700000000000);

    const result = await saveRecording("dGVzdA==", "audio/webm");

    expect(result.fileName).toBe("rec_1700000000000.webm");
    expect(result.fileUri).toMatch(/^blob:/);
  });

  it("maps m4a MIME type correctly", async () => {
    vi.spyOn(Date, "now").mockReturnValue(123);
    const result = await saveRecording("dGVzdA==", "audio/m4a");
    expect(result.fileName).toBe("rec_123.m4a");
  });

  it("maps mp4 MIME type to m4a extension", async () => {
    vi.spyOn(Date, "now").mockReturnValue(123);
    const result = await saveRecording("dGVzdA==", "audio/mp4");
    expect(result.fileName).toBe("rec_123.m4a");
  });

  it("maps wav MIME type correctly", async () => {
    vi.spyOn(Date, "now").mockReturnValue(123);
    const result = await saveRecording("dGVzdA==", "audio/wav");
    expect(result.fileName).toBe("rec_123.wav");
  });

  it("defaults to webm for unknown MIME types", async () => {
    vi.spyOn(Date, "now").mockReturnValue(123);
    const result = await saveRecording("dGVzdA==", "audio/unknown");
    expect(result.fileName).toBe("rec_123.webm");
  });

  it("persists the recording to IndexedDB", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1700000000000);

    await saveRecording("dGVzdA==", "audio/webm");

    const recordings = await listRecordings();
    expect(recordings).toHaveLength(1);
    expect(recordings[0].fileName).toBe("rec_1700000000000.webm");
  });
});

describe("listRecordings", () => {
  it("returns empty array when no recordings exist", async () => {
    const result = await listRecordings();
    expect(result).toEqual([]);
  });

  it("returns recordings sorted newest-first", async () => {
    // Insert records directly into IndexedDB with known timestamps
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.put({
        fileName: "old.webm",
        base64: "b2xk",
        mimeType: "audio/webm",
        createdAt: "2001-01-01T00:00:00.000Z",
      });
      store.put({
        fileName: "new.webm",
        base64: "bmV3",
        mimeType: "audio/webm",
        createdAt: "2025-06-01T00:00:00.000Z",
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();

    const result = await listRecordings();

    expect(result).toHaveLength(2);
    expect(result[0].fileName).toBe("new.webm");
    expect(result[1].fileName).toBe("old.webm");
  });

  it("returns blob URIs for playback", async () => {
    vi.spyOn(Date, "now").mockReturnValue(123);
    await saveRecording("dGVzdA==", "audio/webm");

    const result = await listRecordings();

    expect(result[0].fileUri).toMatch(/^blob:/);
  });

  it("returns createdAt as Date objects", async () => {
    vi.spyOn(Date, "now").mockReturnValue(123);
    await saveRecording("dGVzdA==", "audio/webm");

    const result = await listRecordings();

    expect(result[0].createdAt).toBeInstanceOf(Date);
  });
});

describe("deleteRecording", () => {
  it("removes a recording from IndexedDB", async () => {
    vi.spyOn(Date, "now").mockReturnValue(123);
    await saveRecording("dGVzdA==", "audio/webm");

    let recordings = await listRecordings();
    expect(recordings).toHaveLength(1);

    await deleteRecording("rec_123.webm");

    recordings = await listRecordings();
    expect(recordings).toHaveLength(0);
  });

  it("does not throw when deleting nonexistent recording", async () => {
    await expect(
      deleteRecording("nonexistent.webm"),
    ).resolves.toBeUndefined();
  });
});

describe("getRecordingBase64", () => {
  it("returns base64 content when looking up by fileName", async () => {
    vi.spyOn(Date, "now").mockReturnValue(123);
    await saveRecording("dGVzdA==", "audio/webm");

    const base64 = await getRecordingBase64("rec_123.webm");
    expect(base64).toBe("dGVzdA==");
  });

  it("returns base64 content when URI contains fileName", async () => {
    vi.spyOn(Date, "now").mockReturnValue(123);
    await saveRecording("dGVzdA==", "audio/webm");

    const base64 = await getRecordingBase64(
      "indexeddb://audio/rec_123.webm",
    );
    expect(base64).toBe("dGVzdA==");
  });

  it("throws when recording is not found", async () => {
    await expect(getRecordingBase64("nonexistent")).rejects.toThrow(
      "Recording not found: nonexistent",
    );
  });
});
