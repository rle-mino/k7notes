import { Controller } from "@nestjs/common";
import { Implement } from "@orpc/nest";
import { contract } from "@k7notes/contracts";
import { authed } from "../auth/auth.middleware.js";
import { DailyNotesService } from "./daily-notes.service.js";

@Controller()
export class DailyNotesController {
  constructor(private readonly dailyNotesService: DailyNotesService) {}

  @Implement(contract.notes.getOrCreateDailyNote)
  getOrCreateDailyNote() {
    return authed(contract.notes.getOrCreateDailyNote).handler(
      async ({ input, context }) => {
        return this.dailyNotesService.createDailyNote(
          context.user.id,
          input.date,
        );
      },
    );
  }

  @Implement(contract.notes.refreshDailyNoteEvents)
  refreshDailyNoteEvents() {
    return authed(contract.notes.refreshDailyNoteEvents).handler(
      async ({ input, context }) => {
        return this.dailyNotesService.refreshDailyNoteEvents(
          context.user.id,
          input.noteId,
        );
      },
    );
  }
}
