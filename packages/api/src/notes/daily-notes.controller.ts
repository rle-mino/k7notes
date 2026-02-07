import { Controller, UseGuards } from "@nestjs/common";
import { Implement, implement } from "@orpc/nest";
import { contract } from "@k7notes/contracts";
import { AuthGuard, AuthenticatedRequest } from "../auth/auth.guard.js";
import { DailyNotesService } from "./daily-notes.service.js";

@Controller()
@UseGuards(AuthGuard)
export class DailyNotesController {
  constructor(private readonly dailyNotesService: DailyNotesService) {}

  @Implement(contract.notes.getOrCreateDailyNote)
  getOrCreateDailyNote() {
    return implement(contract.notes.getOrCreateDailyNote).handler(
      async ({ input, context }) => {
        const req = context.request as unknown as AuthenticatedRequest;
        return this.dailyNotesService.createDailyNote(req.user.id, input.date);
      },
    );
  }

  @Implement(contract.notes.refreshDailyNoteEvents)
  refreshDailyNoteEvents() {
    return implement(contract.notes.refreshDailyNoteEvents).handler(
      async ({ input, context }) => {
        const req = context.request as unknown as AuthenticatedRequest;
        return this.dailyNotesService.refreshDailyNoteEvents(
          req.user.id,
          input.noteId,
        );
      },
    );
  }
}
