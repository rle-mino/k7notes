import { Injectable, BadRequestException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { transcriptions } from "../db/schema.js";
import {
  TranscriptionProviderFactory,
  TranscriptionResult,
  TranscriptionOptions,
  TranscriptionProviderType,
} from "./providers/index.js";

export interface ProviderInfo {
  name: string;
  supportsDiarization: boolean;
  supportedFormats: string[];
  maxFileSizeMB: number;
  available: boolean;
}

@Injectable()
export class TranscriptionsService {
  /**
   * Transcribe audio from a buffer and persist the result
   */
  async transcribe(
    userId: string,
    audioBuffer: Buffer,
    mimeType: string,
    options?: TranscriptionOptions & { provider?: TranscriptionProviderType }
  ): Promise<TranscriptionResult & { id: string }> {
    const provider = options?.provider
      ? TranscriptionProviderFactory.getProvider(options.provider)
      : TranscriptionProviderFactory.getDefaultProvider();

    if (!provider.isAvailable()) {
      throw new BadRequestException(
        `Transcription provider "${provider.name}" is not configured. ` +
          `Please set the required API key in environment variables.`
      );
    }

    if (audioBuffer.length > provider.maxFileSizeBytes) {
      const maxMB = Math.round(provider.maxFileSizeBytes / (1024 * 1024));
      throw new BadRequestException(
        `Audio file too large. Maximum size for ${provider.name} is ${maxMB}MB.`
      );
    }

    if (!provider.supportedFormats.includes(mimeType)) {
      throw new BadRequestException(
        `Unsupported audio format: ${mimeType}. ` +
          `Supported formats: ${provider.supportedFormats.join(", ")}`
      );
    }

    const result = await provider.transcribe(audioBuffer, mimeType, {
      language: options?.language,
      diarization: options?.diarization,
      speakerNames: options?.speakerNames,
    });

    // Persist to database
    const rows = await db
      .insert(transcriptions)
      .values({
        userId,
        provider: provider.name,
        text: result.text,
        segments: result.segments,
        durationSeconds: result.durationSeconds,
        language: result.language ?? null,
      })
      .returning({ id: transcriptions.id });

    return {
      ...result,
      id: rows[0]!.id,
      provider: provider.name,
    };
  }

  /**
   * Transcribe audio from base64-encoded string
   */
  async transcribeBase64(
    userId: string,
    audioBase64: string,
    mimeType: string,
    options?: TranscriptionOptions & { provider?: TranscriptionProviderType }
  ): Promise<TranscriptionResult & { id: string }> {
    const audioBuffer = Buffer.from(audioBase64, "base64");
    return this.transcribe(userId, audioBuffer, mimeType, options);
  }

  /**
   * Link a transcription to a note after the note is created
   */
  async linkToNote(transcriptionId: string, noteId: string): Promise<void> {
    await db
      .update(transcriptions)
      .set({ noteId })
      .where(eq(transcriptions.id, transcriptionId));
  }

  /**
   * Get list of available transcription providers
   */
  getProviders(): { providers: ProviderInfo[]; defaultProvider: string } {
    const providers: ProviderInfo[] = TranscriptionProviderFactory.getAllProviderTypes().map((type) => {
      const provider = TranscriptionProviderFactory.getProvider(type);
      return {
        name: provider.name,
        supportsDiarization: provider.supportsDiarization,
        supportedFormats: provider.supportedFormats,
        maxFileSizeMB: Math.round(provider.maxFileSizeBytes / (1024 * 1024)),
        available: provider.isAvailable(),
      };
    });

    return {
      providers,
      defaultProvider: TranscriptionProviderFactory.getDefaultProvider().name,
    };
  }
}
