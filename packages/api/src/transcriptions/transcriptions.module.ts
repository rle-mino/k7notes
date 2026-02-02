import { Module } from "@nestjs/common";
import { TranscriptionsController } from "./transcriptions.controller.js";
import { TranscriptionsService } from "./transcriptions.service.js";

@Module({
  controllers: [TranscriptionsController],
  providers: [TranscriptionsService],
  exports: [TranscriptionsService],
})
export class TranscriptionsModule {}
