import { Injectable } from "@nestjs/common";
import type { TranscriptionOptions, TranscriptionSegment } from "@k7notes/contracts";
import {
  TranscriptionProvider,
  ProviderTranscriptionResult,
} from "./transcription-provider.interface.js";

/**
 * OpenAI Diarization Response Types
 * Based on the gpt-4o-transcribe-diarize model's diarized_json format
 */
interface OpenAIDiarizedSegment {
  speaker: string;
  text: string;
  start: number;
  end: number;
}

interface OpenAIDiarizedResponse {
  text: string;
  segments: OpenAIDiarizedSegment[];
}

const MIME_TO_EXTENSION: Record<string, string> = {
  "audio/mp3": "mp3",
  "audio/mpeg": "mp3",
  "audio/mp4": "mp4",
  "audio/m4a": "m4a",
  "audio/wav": "wav",
  "audio/webm": "webm",
  "audio/mpga": "mpga",
};

/**
 * OpenAI Transcription Provider
 *
 * Uses the gpt-4o-transcribe-diarize model for high-quality transcription
 * with speaker diarization (speaker detection).
 *
 * Features:
 * - Automatic speaker identification (up to ~10 speakers)
 * - High accuracy transcription
 * - Supports multiple languages
 *
 * Limitations:
 * - Max file size: 25MB
 * - Max audio length for diarization: ~1400 seconds per chunk
 * - Audio >30s requires chunking_strategy: "auto"
 */
@Injectable()
export class OpenAITranscriptionProvider implements TranscriptionProvider {
  readonly name = "openai";
  readonly supportsDiarization = true;
  readonly supportedFormats = [
    "audio/mp3",
    "audio/mpeg",
    "audio/mp4",
    "audio/m4a",
    "audio/wav",
    "audio/webm",
    "audio/mpga",
  ];
  readonly maxFileSizeBytes = 25 * 1024 * 1024; // 25MB

  private readonly apiKey: string | undefined;
  private readonly apiUrl = "https://api.openai.com/v1/audio/transcriptions";

  /** Model for transcription with diarization */
  private readonly diarizeModel = "gpt-4o-transcribe-diarize";
  /** Model for transcription without diarization (faster, cheaper) */
  private readonly transcribeModel = "gpt-4o-transcribe";

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async transcribe(
    audioBuffer: Buffer,
    mimeType: string,
    options?: TranscriptionOptions
  ): Promise<ProviderTranscriptionResult> {
    if (!this.apiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const useDiarization = options?.diarization !== false;
    const model = useDiarization ? this.diarizeModel : this.transcribeModel;

    // Build form data for multipart upload
    const formData = new FormData();

    // Convert buffer to Blob with proper MIME type
    const extension = MIME_TO_EXTENSION[mimeType] || "mp3";
    const blob = new Blob([audioBuffer], { type: mimeType });
    formData.append("file", blob, `audio.${extension}`);

    formData.append("model", model);

    // Request diarized JSON format for speaker labels
    if (useDiarization) {
      formData.append("response_format", "diarized_json");
      // Required for audio > 30 seconds
      formData.append("chunking_strategy", "auto");
    } else {
      formData.append("response_format", "json");
    }

    // Set language if specified
    if (options?.language) {
      formData.append("language", options.language);
    }

    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }

    if (useDiarization) {
      const data = (await response.json()) as OpenAIDiarizedResponse;
      return this.parseDiarizedResponse(data, options?.speakerNames);
    } else {
      const data = (await response.json()) as { text: string; duration?: number };
      return {
        text: data.text,
        segments: [],
        durationSeconds: data.duration ?? 0,
      };
    }
  }

  /**
   * Parse the diarized response from OpenAI into our standard format
   */
  private parseDiarizedResponse(
    response: OpenAIDiarizedResponse,
    speakerNames?: string[]
  ): ProviderTranscriptionResult {
    const segments: TranscriptionSegment[] = response.segments.map((seg) => {
      // Map speaker letters (A, B, C) to provided names if available
      let speaker = seg.speaker;
      if (speakerNames && speakerNames.length > 0) {
        const speakerIndex = seg.speaker.charCodeAt(0) - "A".charCodeAt(0);
        const mappedName = speakerNames[speakerIndex];
        if (speakerIndex >= 0 && mappedName !== undefined) {
          speaker = mappedName;
        }
      }

      return {
        speaker,
        text: seg.text,
        startTime: seg.start,
        endTime: seg.end,
      };
    });

    // Calculate duration from last segment
    const lastSegment = segments[segments.length - 1];
    const durationSeconds = lastSegment ? lastSegment.endTime : 0;

    return {
      text: response.text,
      segments,
      durationSeconds,
      metadata: {
        provider: "openai",
        model: this.diarizeModel,
      },
    };
  }
}
