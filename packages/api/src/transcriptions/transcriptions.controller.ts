import { Controller, UseGuards } from "@nestjs/common";
import { Implement, implement } from "@orpc/nest";
import { contract } from "@k7notes/contracts";
import { AuthGuard, AuthenticatedRequest } from "../auth/auth.guard.js";
import { TranscriptionsService } from "./transcriptions.service.js";

@Controller()
@UseGuards(AuthGuard)
export class TranscriptionsController {
  constructor(private readonly transcriptionsService: TranscriptionsService) {}

  @Implement(contract.transcriptions.transcribe)
  transcribe() {
    return implement(contract.transcriptions.transcribe).handler(
      async ({ input, context }) => {
        const req = context.request as unknown as AuthenticatedRequest;
        const userId = req.user.id;

        const result = await this.transcriptionsService.transcribeBase64(
          userId,
          input.audioBase64,
          input.mimeType,
          {
            language: input.language,
            diarization: input.diarization,
            speakerNames: input.speakerNames,
          }
        );

        return {
          id: result.id,
          text: result.text,
          segments: result.segments,
          durationSeconds: result.durationSeconds,
          language: result.language,
          provider: result.provider,
        };
      }
    );
  }

  @Implement(contract.transcriptions.linkToNote)
  linkToNote() {
    return implement(contract.transcriptions.linkToNote).handler(
      async ({ input }) => {
        await this.transcriptionsService.linkToNote(
          input.transcriptionId,
          input.noteId
        );
        return { success: true };
      }
    );
  }

  @Implement(contract.transcriptions.listProviders)
  listProviders() {
    return implement(contract.transcriptions.listProviders).handler(async () => {
      return this.transcriptionsService.getProviders();
    });
  }
}
