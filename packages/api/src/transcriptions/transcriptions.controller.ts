import { Controller } from "@nestjs/common";
import { Implement, implement } from "@orpc/nest";
import { contract } from "@k7notes/contracts";
import { authed } from "../auth/auth.middleware.js";
import { TranscriptionsService } from "./transcriptions.service.js";

@Controller()
export class TranscriptionsController {
  constructor(private readonly transcriptionsService: TranscriptionsService) {}

  @Implement(contract.transcriptions.transcribe)
  transcribe() {
    return authed(contract.transcriptions.transcribe).handler(
      async ({ input, context }) => {
        const userId = context.user.id;

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

  @Implement(contract.transcriptions.list)
  list() {
    return authed(contract.transcriptions.list).handler(
      async ({ context }) => {
        return this.transcriptionsService.list(context.user.id);
      }
    );
  }

  @Implement(contract.transcriptions.updateTitle)
  updateTitle() {
    return authed(contract.transcriptions.updateTitle).handler(
      async ({ input, context }) => {
        await this.transcriptionsService.updateTitle(
          context.user.id,
          input.id,
          input.title
        );
        return { success: true as const };
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
