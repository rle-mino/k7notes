import { z } from "zod";

/**
 * Transcription Schemas
 *
 * Defines the input/output types for speech-to-text operations
 */

/** Supported transcription providers. Add new providers here as they are implemented. */
export const TranscriptionProviderSchema = z.enum(["openai"]);

/** A single segment of transcribed audio with speaker info */
export const TranscriptionSegmentSchema = z.object({
  /** Speaker identifier (e.g., "A", "B", or actual name) */
  speaker: z.string(),
  /** Transcribed text for this segment */
  text: z.string(),
  /** Start time in seconds */
  startTime: z.number(),
  /** End time in seconds */
  endTime: z.number(),
});

/** Full transcription result */
export const TranscriptionResultSchema = z.object({
  /** Persisted transcription ID */
  id: z.string().uuid(),
  /** Full transcribed text (plain, without speaker labels) */
  text: z.string(),
  /** Segments with speaker diarization */
  segments: z.array(TranscriptionSegmentSchema),
  /** Duration of the audio in seconds */
  durationSeconds: z.number(),
  /** Language detected or specified */
  language: z.string().optional(),
  /** Provider used for transcription */
  provider: z.string().optional(),
});

/** Options for transcription request */
export const TranscriptionOptionsSchema = z.object({
  /** Preferred language (ISO 639-1 code, e.g., "en", "fr") */
  language: z.string().optional(),
  /** Enable speaker diarization (default: true) */
  diarization: z.boolean().optional(),
  /** Known speaker names for better labeling */
  speakerNames: z.array(z.string()).optional(),
});

/** Request schema for transcription endpoint (metadata only, file sent separately) */
export const TranscribeRequestSchema = TranscriptionOptionsSchema;

/** Response for transcription endpoint */
export const TranscribeResponseSchema = TranscriptionResultSchema;

/** Provider info for listing available providers */
export const ProviderInfoSchema = z.object({
  name: z.string(),
  supportsDiarization: z.boolean(),
  supportedFormats: z.array(z.string()),
  maxFileSizeMB: z.number(),
  available: z.boolean(),
});

/** Response for listing providers */
export const ListProvidersResponseSchema = z.object({
  providers: z.array(ProviderInfoSchema),
  defaultProvider: z.string(),
});

// Type exports
export type TranscriptionProvider = z.infer<typeof TranscriptionProviderSchema>;
export type TranscriptionSegment = z.infer<typeof TranscriptionSegmentSchema>;
export type TranscriptionResult = z.infer<typeof TranscriptionResultSchema>;
export type TranscriptionOptions = z.infer<typeof TranscriptionOptionsSchema>;
export type TranscribeRequest = z.infer<typeof TranscribeRequestSchema>;
export type TranscribeResponse = z.infer<typeof TranscribeResponseSchema>;
export type ProviderInfo = z.infer<typeof ProviderInfoSchema>;
export type ListProvidersResponse = z.infer<typeof ListProvidersResponseSchema>;
