/**
 * Local audio storage utility (native)
 * Uses expo-file-system to persist recordings in documentDirectory.
 */
import {
  documentDirectory,
  makeDirectoryAsync,
  writeAsStringAsync,
  readAsStringAsync,
  readDirectoryAsync,
  deleteAsync,
  getInfoAsync,
  EncodingType,
} from "expo-file-system";

export interface SavedRecording {
  fileUri: string;
  fileName: string;
  createdAt: Date;
}

const AUDIO_DIR_NAME = "audio/";

/** Returns the absolute path to the audio directory. */
export function getAudioDir(): string {
  return `${documentDirectory}${AUDIO_DIR_NAME}`;
}

/** Ensures the audio directory exists, creating it if necessary. */
async function ensureAudioDir(): Promise<void> {
  const dir = getAudioDir();
  const info = await getInfoAsync(dir);
  if (!info.exists) {
    await makeDirectoryAsync(dir, { intermediates: true });
  }
}

/** Map a MIME type to a file extension. */
function extensionForMime(mimeType: string): string {
  if (mimeType.includes("m4a") || mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("wav")) return "wav";
  if (mimeType.includes("ogg")) return "ogg";
  return "m4a";
}

/**
 * Save a base64-encoded audio recording to disk.
 * Returns the file URI and generated file name.
 */
export async function saveRecording(
  base64: string,
  mimeType: string,
): Promise<{ fileUri: string; fileName: string }> {
  await ensureAudioDir();

  const ext = extensionForMime(mimeType);
  const fileName = `rec_${Date.now()}.${ext}`;
  const fileUri = `${getAudioDir()}${fileName}`;

  await writeAsStringAsync(fileUri, base64, {
    encoding: EncodingType.Base64,
  });

  return { fileUri, fileName };
}

/**
 * List all recordings in the audio directory, sorted newest-first.
 */
export async function listRecordings(): Promise<SavedRecording[]> {
  await ensureAudioDir();

  const dir = getAudioDir();
  const names = await readDirectoryAsync(dir);

  const recordings: SavedRecording[] = [];

  for (const name of names) {
    const fileUri = `${dir}${name}`;
    const info = await getInfoAsync(fileUri);
    if (info.exists && !info.isDirectory) {
      recordings.push({
        fileUri,
        fileName: name,
        // modificationTime is seconds since epoch on native
        createdAt: new Date((info.modificationTime ?? 0) * 1000),
      });
    }
  }

  // Sort newest first
  recordings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return recordings;
}

/**
 * Delete a recording by file name.
 */
export async function deleteRecording(fileName: string): Promise<void> {
  const fileUri = `${getAudioDir()}${fileName}`;
  const info = await getInfoAsync(fileUri);
  if (info.exists) {
    await deleteAsync(fileUri, { idempotent: true });
  }
}

/**
 * Read a recording file and return its contents as a base64 string.
 */
export async function getRecordingBase64(fileUri: string): Promise<string> {
  return readAsStringAsync(fileUri, { encoding: EncodingType.Base64 });
}
