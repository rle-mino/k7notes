import { oc } from "@orpc/contract";
import { z } from "zod";
import {
  TranscribeResponseSchema,
  TranscriptionOptionsSchema,
  ListProvidersResponseSchema,
} from "../schemas/transcription";

/**
 * Transcription Contracts
 *
 * Note: The main transcribe endpoint uses multipart form data for file upload,
 * so it's handled directly by NestJS rather than through oRPC contracts.
 * The contracts here are for JSON-based operations.
 */

/** Request for transcription with base64-encoded audio (for smaller files) */
const TranscribeBase64RequestSchema = TranscriptionOptionsSchema.extend({
  /** Base64-encoded audio data */
  audioBase64: z.string(),
  /** MIME type of the audio (e.g., "audio/mp3", "audio/wav") */
  mimeType: z.string(),
});

export const transcriptionsContract = {
  /**
   * Transcribe audio from base64-encoded data
   * Use this for smaller files (<5MB) where base64 encoding overhead is acceptable
   * For larger files, use the multipart upload endpoint: POST /api/transcriptions/upload
   */
  transcribe: oc
    .route({ method: "POST", path: "/api/transcriptions" })
    .input(TranscribeBase64RequestSchema)
    .output(TranscribeResponseSchema),

  /**
   * List available transcription providers
   */
  listProviders: oc
    .route({ method: "GET", path: "/api/transcriptions/providers" })
    .input(z.object({}))
    .output(ListProvidersResponseSchema),
};
