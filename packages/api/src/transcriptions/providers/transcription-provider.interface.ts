/**
 * Transcription Provider Interface
 *
 * This interface defines the contract for speech-to-text providers.
 * New providers (AssemblyAI, Deepgram, Whisper, etc.) can be added
 * by implementing this interface.
 */

import type {
  TranscriptionSegment,
  TranscriptionOptions,
  TranscriptionProviderType,
} from "@k7notes/contracts";

/** Internal result type returned by providers (no `id`, has `metadata`) */
export interface ProviderTranscriptionResult {
  /** Full transcribed text (plain, without speaker labels) */
  text: string;
  /** Segments with speaker diarization (if supported) */
  segments: TranscriptionSegment[];
  /** Duration of the audio in seconds */
  durationSeconds: number;
  /** Language detected or specified */
  language?: string;
  /** Provider that performed the transcription */
  provider?: string;
  /** Provider-specific metadata */
  metadata?: Record<string, unknown>;
}

export interface TranscriptionProvider {
  /** Unique identifier for this provider */
  readonly name: string;

  /** Whether this provider supports diarization */
  readonly supportsDiarization: boolean;

  /** Supported audio formats */
  readonly supportedFormats: string[];

  /** Maximum file size in bytes */
  readonly maxFileSizeBytes: number;

  /**
   * Transcribe an audio file
   * @param audioBuffer - The audio file as a Buffer
   * @param mimeType - MIME type of the audio (e.g., "audio/mp3", "audio/wav")
   * @param options - Transcription options
   * @returns Transcription result with text and segments
   */
  transcribe(
    audioBuffer: Buffer,
    mimeType: string,
    options?: TranscriptionOptions
  ): Promise<ProviderTranscriptionResult>;

  /**
   * Check if the provider is properly configured and available
   */
  isAvailable(): boolean;
}

export type { TranscriptionSegment, TranscriptionOptions, TranscriptionProviderType };
