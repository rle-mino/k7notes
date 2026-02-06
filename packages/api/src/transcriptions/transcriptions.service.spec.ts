import { BadRequestException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import type { Database } from "../db/db.types.js";
import { transcriptions } from "../db/schema.js";
import {
  createTestDb,
  type TestContext,
} from "../../test/create-test-module.js";
import {
  createTestUser,
  createTestNote,
  cleanupDb,
} from "../../test/helpers.js";
import { TranscriptionsService } from "./transcriptions.service.js";
import type { ProviderTranscriptionResult } from "./providers/index.js";

// ---------------------------------------------------------------------------
// Mock provider setup
// ---------------------------------------------------------------------------

const mockTranscribeResult: ProviderTranscriptionResult = {
  text: "Hello world, this is a test transcription.",
  segments: [
    { speaker: "A", text: "Hello world,", startTime: 0, endTime: 1.5 },
    {
      speaker: "B",
      text: "this is a test transcription.",
      startTime: 1.5,
      endTime: 3.0,
    },
  ],
  durationSeconds: 3.0,
  language: "en",
  metadata: { provider: "openai", model: "gpt-4o-transcribe-diarize" },
};

const mockOpenAIProvider = {
  name: "openai",
  supportsDiarization: true,
  supportedFormats: [
    "audio/mp3",
    "audio/mpeg",
    "audio/mp4",
    "audio/m4a",
    "audio/wav",
    "audio/webm",
    "audio/mpga",
  ],
  maxFileSizeBytes: 25 * 1024 * 1024,
  isAvailable: vi.fn().mockReturnValue(true),
  transcribe: vi.fn().mockResolvedValue(mockTranscribeResult),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("TranscriptionsService", () => {
  let testContext: TestContext;
  let service: TranscriptionsService;
  let db: Database;

  let userA: { id: string };

  beforeAll(async () => {
    testContext = createTestDb();
    db = testContext.db;
    service = new TranscriptionsService(testContext.db, mockOpenAIProvider as any);
  });

  beforeEach(async () => {
    await cleanupDb(db);
    userA = await createTestUser(db);
    mockOpenAIProvider.transcribe.mockReset();
    mockOpenAIProvider.isAvailable.mockReset();
    mockOpenAIProvider.transcribe.mockResolvedValue(mockTranscribeResult);
    mockOpenAIProvider.isAvailable.mockReturnValue(true);
    mockOpenAIProvider.maxFileSizeBytes = 25 * 1024 * 1024;
  });

  afterAll(async () => {
    await testContext.pool.end();
  });

  // ---------------------------------------------------------------------------
  // transcribe
  // ---------------------------------------------------------------------------
  describe("transcribe", () => {
    it("should transcribe audio buffer, persist to db, and return result with id", async () => {
      const buffer = Buffer.from("fake audio data");
      const result = await service.transcribe(userA.id, buffer, "audio/mp3");

      expect(result.text).toBe(mockTranscribeResult.text);
      expect(result.segments).toEqual(mockTranscribeResult.segments);
      expect(result.durationSeconds).toBe(mockTranscribeResult.durationSeconds);
      expect(result.id).toBeDefined();
      expect(result.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );

      // Verify persistence in the database
      const [row] = await db
        .select()
        .from(transcriptions)
        .where(eq(transcriptions.id, result.id));
      expect(row).toBeDefined();
      expect(row!.userId).toBe(userA.id);
      expect(row!.text).toBe(mockTranscribeResult.text);
      expect(row!.provider).toBe("openai");
      expect(row!.durationSeconds).toBe(3.0);
      expect(row!.language).toBe("en");
    });

    it("should set provider name in the returned result", async () => {
      const buffer = Buffer.from("fake audio data");
      const result = await service.transcribe(userA.id, buffer, "audio/mp3");

      expect(result.provider).toBe("openai");
    });

    it("should pass transcription options to the provider", async () => {
      const buffer = Buffer.from("fake audio data");
      await service.transcribe(userA.id, buffer, "audio/mp3", {
        language: "fr",
        diarization: true,
        speakerNames: ["Alice", "Bob"],
      });

      expect(mockOpenAIProvider.transcribe).toHaveBeenCalledWith(
        buffer,
        "audio/mp3",
        {
          language: "fr",
          diarization: true,
          speakerNames: ["Alice", "Bob"],
        },
      );
    });

    it("should use the default provider when none is specified", async () => {
      const buffer = Buffer.from("fake audio data");
      await service.transcribe(userA.id, buffer, "audio/mp3");

      // The mock (registered as "openai", the default) was called
      expect(mockOpenAIProvider.transcribe).toHaveBeenCalledTimes(1);
    });

    it("should store null language when provider result omits it", async () => {
      mockOpenAIProvider.transcribe.mockResolvedValueOnce({
        text: "No language info",
        segments: [],
        durationSeconds: 1.0,
      });

      const buffer = Buffer.from("audio");
      const result = await service.transcribe(userA.id, buffer, "audio/mp3");

      const [row] = await db
        .select()
        .from(transcriptions)
        .where(eq(transcriptions.id, result.id));
      expect(row!.language).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // transcribeBase64
  // ---------------------------------------------------------------------------
  describe("transcribeBase64", () => {
    it("should decode base64 and delegate to the provider", async () => {
      const originalContent = "fake audio data for base64";
      const base64 = Buffer.from(originalContent).toString("base64");

      const result = await service.transcribeBase64(
        userA.id,
        base64,
        "audio/mp3",
      );

      expect(result.text).toBe(mockTranscribeResult.text);
      expect(result.id).toBeDefined();

      // Verify the provider received a Buffer with decoded content
      const calledBuffer = mockOpenAIProvider.transcribe.mock
        .calls[0]![0] as Buffer;
      expect(calledBuffer.toString()).toBe(originalContent);
    });

    it("should persist the transcription to database", async () => {
      const base64 = Buffer.from("audio data").toString("base64");

      const result = await service.transcribeBase64(
        userA.id,
        base64,
        "audio/wav",
      );

      const [row] = await db
        .select()
        .from(transcriptions)
        .where(eq(transcriptions.id, result.id));
      expect(row).toBeDefined();
      expect(row!.userId).toBe(userA.id);
      expect(row!.provider).toBe("openai");
    });

    it("should forward options through to the provider", async () => {
      const base64 = Buffer.from("audio").toString("base64");

      await service.transcribeBase64(userA.id, base64, "audio/mp3", {
        language: "de",
        diarization: false,
      });

      expect(mockOpenAIProvider.transcribe).toHaveBeenCalledWith(
        expect.any(Buffer),
        "audio/mp3",
        {
          language: "de",
          diarization: false,
          speakerNames: undefined,
        },
      );
    });
  });

  // ---------------------------------------------------------------------------
  // linkToNote
  // ---------------------------------------------------------------------------
  describe("linkToNote", () => {
    it("should update transcription with noteId in the database", async () => {
      // Create a transcription via the service
      const buffer = Buffer.from("audio");
      const transcriptionResult = await service.transcribe(
        userA.id,
        buffer,
        "audio/mp3",
      );

      // Create a note to link to
      const note = await createTestNote(db, userA.id);

      // Link them
      await service.linkToNote(transcriptionResult.id, note.id);

      // Verify the noteId was set in the database
      const [row] = await db
        .select()
        .from(transcriptions)
        .where(eq(transcriptions.id, transcriptionResult.id));
      expect(row).toBeDefined();
      expect(row!.noteId).toBe(note.id);
    });

    it("should have null noteId before linking", async () => {
      const buffer = Buffer.from("audio");
      const result = await service.transcribe(userA.id, buffer, "audio/mp3");

      const [row] = await db
        .select()
        .from(transcriptions)
        .where(eq(transcriptions.id, result.id));
      expect(row!.noteId).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // getProviders
  // ---------------------------------------------------------------------------
  describe("getProviders", () => {
    it("should return list of available providers", () => {
      const { providers } = service.getProviders();

      expect(providers).toHaveLength(1);
      expect(providers[0]!.name).toBe("openai");
    });

    it("should include correct metadata for each provider", () => {
      const { providers } = service.getProviders();
      const openai = providers[0]!;

      expect(openai.name).toBe("openai");
      expect(openai.supportsDiarization).toBe(true);
      expect(openai.supportedFormats).toEqual(
        mockOpenAIProvider.supportedFormats,
      );
      expect(openai.maxFileSizeMB).toBe(25);
      expect(openai.available).toBe(true);
    });

    it("should return the default provider name", () => {
      const { defaultProvider } = service.getProviders();

      expect(defaultProvider).toBe("openai");
    });

    it("should reflect provider availability status", () => {
      mockOpenAIProvider.isAvailable.mockReturnValue(false);

      const { providers } = service.getProviders();

      expect(providers[0]!.available).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // validation
  // ---------------------------------------------------------------------------
  describe("validation", () => {
    it("should throw BadRequestException when file is too large", async () => {
      mockOpenAIProvider.maxFileSizeBytes = 10;

      await expect(
        service.transcribe(userA.id, Buffer.alloc(20), "audio/mp3"),
      ).rejects.toThrow(BadRequestException);
    });

    it("should include size info in the error message for oversized files", async () => {
      mockOpenAIProvider.maxFileSizeBytes = 10;

      await expect(
        service.transcribe(userA.id, Buffer.alloc(20), "audio/mp3"),
      ).rejects.toThrow(/too large/i);
    });

    it("should throw BadRequestException for unsupported audio format", async () => {
      await expect(
        service.transcribe(
          userA.id,
          Buffer.from("data"),
          "audio/ogg",
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it("should include format info in the error message for unsupported formats", async () => {
      await expect(
        service.transcribe(
          userA.id,
          Buffer.from("data"),
          "audio/ogg",
        ),
      ).rejects.toThrow(/unsupported audio format/i);
    });

    it("should throw BadRequestException when provider is unavailable", async () => {
      mockOpenAIProvider.isAvailable.mockReturnValue(false);

      await expect(
        service.transcribe(userA.id, Buffer.from("data"), "audio/mp3"),
      ).rejects.toThrow(BadRequestException);
    });

    it("should include provider name in the error for unavailable provider", async () => {
      mockOpenAIProvider.isAvailable.mockReturnValue(false);

      await expect(
        service.transcribe(userA.id, Buffer.from("data"), "audio/mp3"),
      ).rejects.toThrow(/not configured/i);
    });

    it("should throw BadRequestException for unknown provider", async () => {
      await expect(
        service.transcribe(userA.id, Buffer.from("data"), "audio/mp3", {
          provider: "nonexistent" as "openai",
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should include provider name in the error for unknown provider", async () => {
      await expect(
        service.transcribe(userA.id, Buffer.from("data"), "audio/mp3", {
          provider: "nonexistent" as "openai",
        }),
      ).rejects.toThrow(/unknown transcription provider/i);
    });

    it("should not call the provider when validation fails", async () => {
      // Unsupported format
      await expect(
        service.transcribe(
          userA.id,
          Buffer.from("data"),
          "audio/ogg",
        ),
      ).rejects.toThrow(BadRequestException);

      expect(mockOpenAIProvider.transcribe).not.toHaveBeenCalled();
    });
  });
});
