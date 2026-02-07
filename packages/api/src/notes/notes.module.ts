import { Module } from "@nestjs/common";
import { NotesController } from "./notes.controller.js";
import { DailyNotesController } from "./daily-notes.controller.js";
import { NotesService } from "./notes.service.js";
import { DailyNotesService } from "./daily-notes.service.js";
import { FoldersModule } from "../folders/folders.module.js";
import { CalendarModule } from "../calendar/calendar.module.js";

@Module({
  imports: [FoldersModule, CalendarModule],
  controllers: [NotesController, DailyNotesController],
  providers: [NotesService, DailyNotesService],
  exports: [NotesService, DailyNotesService],
})
export class NotesModule {}
