import {
  TranscriptionProvider,
  TranscriptionProviderType,
} from "./transcription-provider.interface.js";
import { OpenAITranscriptionProvider } from "./openai.provider.js";

/**
 * Factory for creating transcription providers
 *
 * This factory allows easy switching between providers via environment config
 * and supports adding new providers without changing consuming code.
 *
 * To add a new provider:
 * 1. Create a new provider class implementing TranscriptionProvider
 * 2. Add it to the switch statement in createProvider()
 * 3. Add necessary env vars to .env.example
 */
export class TranscriptionProviderFactory {
  private static providers: Map<TranscriptionProviderType, TranscriptionProvider> =
    new Map();

  /**
   * Get or create a provider instance
   * Providers are cached for reuse
   */
  static getProvider(type: TranscriptionProviderType): TranscriptionProvider {
    // Return cached instance if available
    const cached = this.providers.get(type);
    if (cached) {
      return cached;
    }

    // Create new instance
    const provider = this.createProvider(type);
    this.providers.set(type, provider);
    return provider;
  }

  /**
   * Get the default provider based on environment configuration
   * Falls back to OpenAI if not specified
   */
  static getDefaultProvider(): TranscriptionProvider {
    const providerType =
      (process.env.TRANSCRIPTION_PROVIDER as TranscriptionProviderType) || "openai";
    return this.getProvider(providerType);
  }

  /**
   * Get all available (configured) providers
   */
  static getAvailableProviders(): TranscriptionProvider[] {
    const allTypes: TranscriptionProviderType[] = [
      "openai",
      "assemblyai",
      "deepgram",
      "whisper",
    ];

    return allTypes
      .map((type) => {
        try {
          const provider = this.getProvider(type);
          return provider.isAvailable() ? provider : null;
        } catch {
          return null;
        }
      })
      .filter((p): p is TranscriptionProvider => p !== null);
  }

  /**
   * Create a new provider instance
   */
  private static createProvider(type: TranscriptionProviderType): TranscriptionProvider {
    switch (type) {
      case "openai":
        return new OpenAITranscriptionProvider();

      case "assemblyai":
        // TODO: Implement AssemblyAI provider
        throw new Error("AssemblyAI provider not yet implemented");

      case "deepgram":
        // TODO: Implement Deepgram provider
        throw new Error("Deepgram provider not yet implemented");

      case "whisper":
        // TODO: Implement local Whisper provider
        throw new Error("Whisper provider not yet implemented");

      default:
        throw new Error(`Unknown transcription provider: ${type}`);
    }
  }
}
