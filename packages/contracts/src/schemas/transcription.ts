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

/** Request schema for transcription with base64-encoded audio */
export const TranscribeRequestSchema = TranscriptionOptionsSchema.extend({
  /** Base64-encoded audio data */
  audioBase64: z.string(),
  /** MIME type of the audio (e.g., "audio/mp3", "audio/wav") */
  mimeType: z.string(),
  /** Optional title for the transcription (e.g., "Recording 2025-01-15 14:30") */
  title: z.string().max(500).optional(),
  /** Optional local file name for linking on-device audio to transcription */
  localFileName: z.string().max(500).optional(),
});

/** Response for transcription endpoint */
export const TranscribeResponseSchema = TranscriptionResultSchema;

/** Request schema for linking a transcription to a note */
export const LinkToNoteRequestSchema = z.object({
  transcriptionId: z.string().uuid(),
  noteId: z.string().uuid(),
});

/** Response schema for linking a transcription to a note */
export const LinkToNoteResponseSchema = z.object({
  success: z.boolean(),
});

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

/** A single transcription record returned in a list */
export const TranscriptionListItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string().nullable(),
  text: z.string(),
  segments: z.array(TranscriptionSegmentSchema),
  durationSeconds: z.number(),
  language: z.string().nullable(),
  /** Local file name used to match on-device audio to this transcription */
  localFileName: z.string().nullable(),
  createdAt: z.coerce.string(),
});

/** Response for listing transcriptions */
export const ListTranscriptionsResponseSchema = z.array(TranscriptionListItemSchema);

/** Request schema for updating a transcription title */
export const UpdateTranscriptionTitleRequestSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(500),
});

/** Response schema for updating a transcription title */
export const UpdateTranscriptionTitleResponseSchema = z.object({
  success: z.literal(true),
});

// Type exports
export type TranscriptionProviderType = z.infer<typeof TranscriptionProviderSchema>;
export type TranscriptionSegment = z.infer<typeof TranscriptionSegmentSchema>;
export type TranscriptionResult = z.infer<typeof TranscriptionResultSchema>;
export type TranscriptionOptions = z.infer<typeof TranscriptionOptionsSchema>;
export type TranscribeRequest = z.infer<typeof TranscribeRequestSchema>;
export type TranscribeResponse = z.infer<typeof TranscribeResponseSchema>;
export type ProviderInfo = z.infer<typeof ProviderInfoSchema>;
export type ListProvidersResponse = z.infer<typeof ListProvidersResponseSchema>;
export type LinkToNoteRequest = z.infer<typeof LinkToNoteRequestSchema>;
export type LinkToNoteResponse = z.infer<typeof LinkToNoteResponseSchema>;
export type TranscriptionListItem = z.infer<typeof TranscriptionListItemSchema>;
export type ListTranscriptionsResponse = z.infer<typeof ListTranscriptionsResponseSchema>;
export type UpdateTranscriptionTitleRequest = z.infer<typeof UpdateTranscriptionTitleRequestSchema>;
export type UpdateTranscriptionTitleResponse = z.infer<typeof UpdateTranscriptionTitleResponseSchema>;
