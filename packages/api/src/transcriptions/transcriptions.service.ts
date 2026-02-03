import { Injectable, BadRequestException } from "@nestjs/common";
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
   * Transcribe audio from a buffer
   */
  async transcribe(
    audioBuffer: Buffer,
    mimeType: string,
    options?: TranscriptionOptions & { provider?: TranscriptionProviderType }
  ): Promise<TranscriptionResult> {
    // Get the appropriate provider
    const provider = options?.provider
      ? TranscriptionProviderFactory.getProvider(options.provider)
      : TranscriptionProviderFactory.getDefaultProvider();

    // Validate provider is available
    if (!provider.isAvailable()) {
      throw new BadRequestException(
        `Transcription provider "${provider.name}" is not configured. ` +
          `Please set the required API key in environment variables.`
      );
    }

    // Validate file size
    if (audioBuffer.length > provider.maxFileSizeBytes) {
      const maxMB = Math.round(provider.maxFileSizeBytes / (1024 * 1024));
      throw new BadRequestException(
        `Audio file too large. Maximum size for ${provider.name} is ${maxMB}MB.`
      );
    }

    // Validate MIME type
    if (!provider.supportedFormats.includes(mimeType)) {
      throw new BadRequestException(
        `Unsupported audio format: ${mimeType}. ` +
          `Supported formats: ${provider.supportedFormats.join(", ")}`
      );
    }

    // Perform transcription
    const result = await provider.transcribe(audioBuffer, mimeType, {
      language: options?.language,
      diarization: options?.diarization,
      speakerNames: options?.speakerNames,
    });

    return {
      ...result,
      provider: provider.name,
    };
  }

  /**
   * Transcribe audio from base64-encoded string
   */
  async transcribeBase64(
    audioBase64: string,
    mimeType: string,
    options?: TranscriptionOptions & { provider?: TranscriptionProviderType }
  ): Promise<TranscriptionResult> {
    // Decode base64 to buffer
    const audioBuffer = Buffer.from(audioBase64, "base64");
    return this.transcribe(audioBuffer, mimeType, options);
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
