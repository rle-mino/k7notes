import { Inject, Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { eq, and, desc } from "drizzle-orm";
import type { ProviderInfo, TranscriptionProviderType } from "@k7notes/contracts";
import { DB_TOKEN, type Database } from "../db/db.types.js";
import { transcriptions } from "../db/schema.js";
import {
  TranscriptionProvider,
  ProviderTranscriptionResult,
  TranscriptionOptions,
  OpenAITranscriptionProvider,
} from "./providers/index.js";

@Injectable()
export class TranscriptionsService {
  private readonly providers: Map<string, TranscriptionProvider>;
  private readonly defaultProvider = "openai";

  constructor(
    @Inject(DB_TOKEN) private readonly db: Database,
    private readonly openaiProvider: OpenAITranscriptionProvider
  ) {
    this.providers = new Map<string, TranscriptionProvider>([
      ["openai", this.openaiProvider],
    ]);
  }

  private getProvider(type?: TranscriptionProviderType): TranscriptionProvider {
    const name = type ?? this.defaultProvider;
    const provider = this.providers.get(name);
    if (!provider) {
      throw new BadRequestException(`Unknown transcription provider: ${name}`);
    }
    return provider;
  }

  /**
   * Transcribe audio from a buffer and persist the result
   */
  async transcribe(
    userId: string,
    audioBuffer: Buffer,
    mimeType: string,
    options?: TranscriptionOptions & { provider?: TranscriptionProviderType }
  ): Promise<ProviderTranscriptionResult & { id: string }> {
    const provider = this.getProvider(options?.provider);

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
    const rows = await this.db
      .insert(transcriptions)
      .values({
        userId,
        provider: provider.name,
        text: result.text,
        segments: result.segments,
        durationSeconds: result.durationSeconds,
        language: result.language ?? null,
        metadata: result.metadata ?? null,
      })
      .returning({ id: transcriptions.id });

    const inserted = rows[0];
    if (!inserted) {
      throw new Error("Failed to persist transcription");
    }

    return {
      ...result,
      id: inserted.id,
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
  ): Promise<ProviderTranscriptionResult & { id: string }> {
    const audioBuffer = Buffer.from(audioBase64, "base64");
    return this.transcribe(userId, audioBuffer, mimeType, options);
  }

  /**
   * Link a transcription to a note after the note is created
   */
  async linkToNote(transcriptionId: string, noteId: string): Promise<void> {
    await this.db
      .update(transcriptions)
      .set({ noteId })
      .where(eq(transcriptions.id, transcriptionId));
  }

  /**
   * List all transcriptions for a user, ordered by most recent first
   */
  async list(userId: string) {
    const rows = await this.db
      .select({
        id: transcriptions.id,
        title: transcriptions.title,
        text: transcriptions.text,
        segments: transcriptions.segments,
        durationSeconds: transcriptions.durationSeconds,
        language: transcriptions.language,
        createdAt: transcriptions.createdAt,
      })
      .from(transcriptions)
      .where(eq(transcriptions.userId, userId))
      .orderBy(desc(transcriptions.createdAt));

    return rows.map((row) => ({
      ...row,
      segments: row.segments as { speaker: string; text: string; startTime: number; endTime: number }[],
      createdAt: row.createdAt.toISOString(),
    }));
  }

  /**
   * Update the title of a transcription
   */
  async updateTitle(userId: string, id: string, title: string): Promise<void> {
    const [existing] = await this.db
      .select({ id: transcriptions.id })
      .from(transcriptions)
      .where(and(eq(transcriptions.id, id), eq(transcriptions.userId, userId)))
      .limit(1);

    if (!existing) {
      throw new NotFoundException("Transcription not found");
    }

    await this.db
      .update(transcriptions)
      .set({ title })
      .where(and(eq(transcriptions.id, id), eq(transcriptions.userId, userId)));
  }

  /**
   * Get list of available transcription providers
   */
  getProviders(): { providers: ProviderInfo[]; defaultProvider: string } {
    const providerList: ProviderInfo[] = [];

    for (const provider of this.providers.values()) {
      providerList.push({
        name: provider.name,
        supportsDiarization: provider.supportsDiarization,
        supportedFormats: provider.supportedFormats,
        maxFileSizeMB: Math.round(provider.maxFileSizeBytes / (1024 * 1024)),
        available: provider.isAvailable(),
      });
    }

    return {
      providers: providerList,
      defaultProvider: this.defaultProvider,
    };
  }
}
