import { Controller, UseGuards } from "@nestjs/common";
import { Implement, implement } from "@orpc/nest";
import { contract } from "@k7notes/contracts";
import { AuthGuard } from "../auth/auth.guard.js";
import { TranscriptionsService } from "./transcriptions.service.js";

@Controller()
@UseGuards(AuthGuard)
export class TranscriptionsController {
  constructor(private readonly transcriptionsService: TranscriptionsService) {}

  /**
   * Transcribe audio from base64-encoded data
   * For smaller files where base64 overhead is acceptable
   */
  @Implement(contract.transcriptions.transcribe)
  transcribe() {
    return implement(contract.transcriptions.transcribe).handler(
      async ({ input }) => {
        const result = await this.transcriptionsService.transcribeBase64(
          input.audioBase64,
          input.mimeType,
          {
            language: input.language,
            diarization: input.diarization,
            speakerNames: input.speakerNames,
            provider: input.provider,
          }
        );

        return {
          text: result.text,
          segments: result.segments,
          durationSeconds: result.durationSeconds,
          language: result.language,
          provider: result.provider,
        };
      }
    );
  }

  /**
   * List available transcription providers
   */
  @Implement(contract.transcriptions.listProviders)
  listProviders() {
    return implement(contract.transcriptions.listProviders).handler(async () => {
      return this.transcriptionsService.getProviders();
    });
  }
}
