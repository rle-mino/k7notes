import { oc } from "@orpc/contract";
import { z } from "zod";
import {
  TranscribeRequestSchema,
  TranscribeResponseSchema,
  ListProvidersResponseSchema,
  LinkToNoteRequestSchema,
  LinkToNoteResponseSchema,
  ListTranscriptionsResponseSchema,
  UpdateTranscriptionTitleRequestSchema,
  UpdateTranscriptionTitleResponseSchema,
} from "../schemas/transcription";

export const transcriptionsContract = {
  /**
   * Transcribe audio from base64-encoded data
   * Use this for smaller files (<5MB) where base64 encoding overhead is acceptable
   * For larger files, use the multipart upload endpoint: POST /api/transcriptions/upload
   */
  transcribe: oc
    .route({ method: "POST", path: "/api/transcriptions" })
    .input(TranscribeRequestSchema)
    .output(TranscribeResponseSchema),

  /**
   * Link a transcription to a note
   */
  linkToNote: oc
    .route({ method: "POST", path: "/api/transcriptions/link-note" })
    .input(LinkToNoteRequestSchema)
    .output(LinkToNoteResponseSchema),

  /**
   * List all transcriptions for the authenticated user
   */
  list: oc
    .route({ method: "GET", path: "/api/transcriptions" })
    .input(z.object({}))
    .output(ListTranscriptionsResponseSchema),

  /**
   * Update the title of a transcription
   */
  updateTitle: oc
    .route({ method: "PUT", path: "/api/transcriptions/{id}/title" })
    .input(UpdateTranscriptionTitleRequestSchema)
    .output(UpdateTranscriptionTitleResponseSchema),

  /**
   * List available transcription providers
   */
  listProviders: oc
    .route({ method: "GET", path: "/api/transcriptions/providers" })
    .input(z.object({}))
    .output(ListProvidersResponseSchema),
};
