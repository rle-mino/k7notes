import {
  TranscriptionProvider,
  TranscriptionProviderType,
} from "./transcription-provider.interface.js";
import { OpenAITranscriptionProvider } from "./openai.provider.js";

/** Currently available providers. Add new entries here as they are implemented. */
const AVAILABLE_PROVIDERS: TranscriptionProviderType[] = ["openai"];

const DEFAULT_PROVIDER: TranscriptionProviderType = "openai";

/**
 * Factory for creating transcription providers
 *
 * To add a new provider:
 * 1. Create a new provider class implementing TranscriptionProvider
 * 2. Add it to createProvider() and AVAILABLE_PROVIDERS
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
    const cached = this.providers.get(type);
    if (cached) {
      return cached;
    }

    const provider = this.createProvider(type);
    this.providers.set(type, provider);
    return provider;
  }

  /**
   * Get the default provider
   */
  static getDefaultProvider(): TranscriptionProvider {
    return this.getProvider(DEFAULT_PROVIDER);
  }

  /**
   * Get all available (configured) providers
   */
  static getAvailableProviders(): TranscriptionProvider[] {
    return AVAILABLE_PROVIDERS
      .map((type) => {
        const provider = this.getProvider(type);
        return provider.isAvailable() ? provider : null;
      })
      .filter((p): p is TranscriptionProvider => p !== null);
  }

  /**
   * List of all implemented provider types
   */
  static getAllProviderTypes(): TranscriptionProviderType[] {
    return AVAILABLE_PROVIDERS;
  }

  private static createProvider(type: TranscriptionProviderType): TranscriptionProvider {
    switch (type) {
      case "openai":
        return new OpenAITranscriptionProvider();

      default:
        throw new Error(`Unknown transcription provider: ${type}`);
    }
  }
}
