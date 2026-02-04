import { Module } from "@nestjs/common";
import { TranscriptionsController } from "./transcriptions.controller.js";
import { TranscriptionsService } from "./transcriptions.service.js";
import { OpenAITranscriptionProvider } from "./providers/index.js";

@Module({
  controllers: [TranscriptionsController],
  providers: [OpenAITranscriptionProvider, TranscriptionsService],
  exports: [TranscriptionsService],
})
export class TranscriptionsModule {}
