/**
 * Local audio storage utility (web)
 * Uses IndexedDB to persist recordings in the browser.
 */

export interface SavedRecording {
  fileUri: string;
  fileName: string;
  createdAt: Date;
}

const DB_NAME = "k7notes_audio";
const DB_VERSION = 1;
const STORE_NAME = "recordings";

/** Open (or create) the IndexedDB database. */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "fileName" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

interface StoredRecord {
  fileName: string;
  base64: string;
  mimeType: string;
  createdAt: string; // ISO string
}

/** Returns a virtual path prefix for web audio storage. */
export function getAudioDir(): string {
  return "indexeddb://audio/";
}

/** Map a MIME type to a file extension. */
function extensionForMime(mimeType: string): string {
  if (mimeType.includes("m4a") || mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("wav")) return "wav";
  if (mimeType.includes("ogg")) return "ogg";
  return "webm";
}

/**
 * Save a base64-encoded audio recording to IndexedDB.
 * Returns a blob URL as fileUri and the generated file name.
 */
export async function saveRecording(
  base64: string,
  mimeType: string,
): Promise<{ fileUri: string; fileName: string }> {
  const ext = extensionForMime(mimeType);
  const fileName = `rec_${Date.now()}.${ext}`;

  const db = await openDB();
  const record: StoredRecord = {
    fileName,
    base64,
    mimeType,
    createdAt: new Date().toISOString(),
  };

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  // Create a blob URL for playback
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  const fileUri = URL.createObjectURL(blob);

  return { fileUri, fileName };
}

/**
 * List all recordings stored in IndexedDB, sorted newest-first.
 */
export async function listRecordings(): Promise<SavedRecording[]> {
  const db = await openDB();

  const records = await new Promise<StoredRecord[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result as StoredRecord[]);
    request.onerror = () => reject(request.error);
  });

  const recordings: SavedRecording[] = records.map((r) => {
    // Create a blob URL for each recording so it can be played back
    const binary = atob(r.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: r.mimeType });
    const fileUri = URL.createObjectURL(blob);

    return {
      fileUri,
      fileName: r.fileName,
      createdAt: new Date(r.createdAt),
    };
  });

  // Sort newest first
  recordings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return recordings;
}

/**
 * Delete a recording by file name from IndexedDB.
 */
export async function deleteRecording(fileName: string): Promise<void> {
  const db = await openDB();

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(fileName);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Read a recording from IndexedDB and return its base64 content.
 * On web, fileUri is ignored — we look up by fileName extracted from the URI.
 * Pass the fileName directly or a URI containing the fileName.
 */
export async function getRecordingBase64(fileUri: string): Promise<string> {
  // Extract fileName: if it looks like a blob URL, we need to find by scanning
  // Prefer passing fileName directly
  const db = await openDB();

  // Try to find by iterating (since blob URLs change between sessions)
  const records = await new Promise<StoredRecord[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result as StoredRecord[]);
    request.onerror = () => reject(request.error);
  });

  // Try matching by fileName in the URI or as a direct key
  const match = records.find(
    (r) => fileUri.includes(r.fileName) || r.fileName === fileUri,
  );

  if (match) {
    return match.base64;
  }

  // Fallback: try direct key lookup
  const record = await new Promise<StoredRecord | undefined>(
    (resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).get(fileUri);
      request.onsuccess = () =>
        resolve(request.result as StoredRecord | undefined);
      request.onerror = () => reject(request.error);
    },
  );

  if (record) {
    return record.base64;
  }

  throw new Error(`Recording not found: ${fileUri}`);
}
