export type {
  TranscriptionProvider,
  TranscriptionProviderType,
  TranscriptionResult,
  TranscriptionSegment,
  TranscriptionOptions,
} from "./transcription-provider.interface.js";

export { OpenAITranscriptionProvider } from "./openai.provider.js";
export { TranscriptionProviderFactory } from "./provider-factory.js";
