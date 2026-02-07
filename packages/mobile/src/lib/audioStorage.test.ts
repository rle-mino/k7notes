import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock expo-file-system before importing the module under test
const mockGetInfoAsync = vi.fn();
const mockMakeDirectoryAsync = vi.fn();
const mockWriteAsStringAsync = vi.fn();
const mockReadAsStringAsync = vi.fn();
const mockReadDirectoryAsync = vi.fn();
const mockDeleteAsync = vi.fn();

vi.mock("expo-file-system", () => ({
  documentDirectory: "file:///data/app/",
  EncodingType: { Base64: "base64" },
  getInfoAsync: (...args: unknown[]) => mockGetInfoAsync(...args),
  makeDirectoryAsync: (...args: unknown[]) => mockMakeDirectoryAsync(...args),
  writeAsStringAsync: (...args: unknown[]) => mockWriteAsStringAsync(...args),
  readAsStringAsync: (...args: unknown[]) => mockReadAsStringAsync(...args),
  readDirectoryAsync: (...args: unknown[]) => mockReadDirectoryAsync(...args),
  deleteAsync: (...args: unknown[]) => mockDeleteAsync(...args),
}));

import {
  getAudioDir,
  saveRecording,
  listRecordings,
  deleteRecording,
  getRecordingBase64,
} from "./audioStorage";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getAudioDir", () => {
  it("returns documentDirectory + audio/", () => {
    expect(getAudioDir()).toBe("file:///data/app/audio/");
  });
});

describe("saveRecording", () => {
  beforeEach(() => {
    // Default: directory already exists
    mockGetInfoAsync.mockResolvedValue({ exists: true });
    mockWriteAsStringAsync.mockResolvedValue(undefined);
  });

  it("saves a base64 recording with correct extension", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1700000000000);

    const result = await saveRecording("dGVzdA==", "audio/m4a");

    expect(result.fileName).toBe("rec_1700000000000.m4a");
    expect(result.fileUri).toBe(
      "file:///data/app/audio/rec_1700000000000.m4a",
    );
    expect(mockWriteAsStringAsync).toHaveBeenCalledWith(
      "file:///data/app/audio/rec_1700000000000.m4a",
      "dGVzdA==",
      { encoding: "base64" },
    );
  });

  it("creates audio directory if it does not exist", async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: false });
    vi.spyOn(Date, "now").mockReturnValue(1700000000000);

    await saveRecording("dGVzdA==", "audio/wav");

    expect(mockMakeDirectoryAsync).toHaveBeenCalledWith(
      "file:///data/app/audio/",
      { intermediates: true },
    );
  });

  it("does not recreate directory if it already exists", async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: true });
    vi.spyOn(Date, "now").mockReturnValue(1700000000000);

    await saveRecording("dGVzdA==", "audio/wav");

    expect(mockMakeDirectoryAsync).not.toHaveBeenCalled();
  });

  it("maps webm MIME type correctly", async () => {
    vi.spyOn(Date, "now").mockReturnValue(123);
    await saveRecording("data", "audio/webm");
    expect(mockWriteAsStringAsync).toHaveBeenCalledWith(
      "file:///data/app/audio/rec_123.webm",
      "data",
      { encoding: "base64" },
    );
  });

  it("maps ogg MIME type correctly", async () => {
    vi.spyOn(Date, "now").mockReturnValue(123);
    await saveRecording("data", "audio/ogg");
    expect(mockWriteAsStringAsync).toHaveBeenCalledWith(
      "file:///data/app/audio/rec_123.ogg",
      "data",
      { encoding: "base64" },
    );
  });

  it("defaults to m4a for unknown MIME types", async () => {
    vi.spyOn(Date, "now").mockReturnValue(123);
    await saveRecording("data", "audio/unknown");
    expect(mockWriteAsStringAsync).toHaveBeenCalledWith(
      "file:///data/app/audio/rec_123.m4a",
      "data",
      { encoding: "base64" },
    );
  });
});

describe("listRecordings", () => {
  beforeEach(() => {
    mockGetInfoAsync.mockResolvedValue({ exists: true });
  });

  it("returns recordings sorted newest-first", async () => {
    mockReadDirectoryAsync.mockResolvedValue(["old.m4a", "new.m4a"]);
    mockGetInfoAsync
      .mockResolvedValueOnce({ exists: true }) // ensureAudioDir check
      .mockResolvedValueOnce({
        exists: true,
        isDirectory: false,
        modificationTime: 1000,
      })
      .mockResolvedValueOnce({
        exists: true,
        isDirectory: false,
        modificationTime: 2000,
      });

    const result = await listRecordings();

    expect(result).toHaveLength(2);
    expect(result[0].fileName).toBe("new.m4a");
    expect(result[0].createdAt).toEqual(new Date(2000 * 1000));
    expect(result[1].fileName).toBe("old.m4a");
    expect(result[1].createdAt).toEqual(new Date(1000 * 1000));
  });

  it("skips directories in the audio folder", async () => {
    mockReadDirectoryAsync.mockResolvedValue(["file.m4a", "subdir"]);
    mockGetInfoAsync
      .mockResolvedValueOnce({ exists: true }) // ensureAudioDir
      .mockResolvedValueOnce({
        exists: true,
        isDirectory: false,
        modificationTime: 1000,
      })
      .mockResolvedValueOnce({
        exists: true,
        isDirectory: true,
        modificationTime: 1000,
      });

    const result = await listRecordings();

    expect(result).toHaveLength(1);
    expect(result[0].fileName).toBe("file.m4a");
  });

  it("returns empty array when no recordings exist", async () => {
    mockReadDirectoryAsync.mockResolvedValue([]);

    const result = await listRecordings();

    expect(result).toEqual([]);
  });

  it("handles null modificationTime gracefully", async () => {
    mockReadDirectoryAsync.mockResolvedValue(["file.m4a"]);
    mockGetInfoAsync
      .mockResolvedValueOnce({ exists: true }) // ensureAudioDir
      .mockResolvedValueOnce({
        exists: true,
        isDirectory: false,
        modificationTime: undefined,
      });

    const result = await listRecordings();

    expect(result).toHaveLength(1);
    expect(result[0].createdAt).toEqual(new Date(0));
  });
});

describe("deleteRecording", () => {
  it("deletes a file that exists", async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: true });
    mockDeleteAsync.mockResolvedValue(undefined);

    await deleteRecording("rec_123.m4a");

    expect(mockDeleteAsync).toHaveBeenCalledWith(
      "file:///data/app/audio/rec_123.m4a",
      { idempotent: true },
    );
  });

  it("does nothing if file does not exist", async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: false });

    await deleteRecording("nonexistent.m4a");

    expect(mockDeleteAsync).not.toHaveBeenCalled();
  });
});

describe("getRecordingBase64", () => {
  it("reads file as base64", async () => {
    mockReadAsStringAsync.mockResolvedValue("dGVzdA==");

    const result = await getRecordingBase64(
      "file:///data/app/audio/rec_123.m4a",
    );

    expect(result).toBe("dGVzdA==");
    expect(mockReadAsStringAsync).toHaveBeenCalledWith(
      "file:///data/app/audio/rec_123.m4a",
      { encoding: "base64" },
    );
  });
});
