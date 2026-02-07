import { Controller } from "@nestjs/common";
import { Implement } from "@orpc/nest";
import { contract } from "@k7notes/contracts";
import { authed } from "../auth/auth.middleware.js";
import { NotesService } from "./notes.service.js";

@Controller()
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Implement(contract.notes.create)
  create() {
    return authed(contract.notes.create).handler(async ({ input, context }) => {
      return this.notesService.create(context.user.id, input);
    });
  }

  @Implement(contract.notes.list)
  list() {
    return authed(contract.notes.list).handler(async ({ input, context }) => {
      return this.notesService.findAll(context.user.id, input.folderId);
    });
  }

  @Implement(contract.notes.search)
  search() {
    return authed(contract.notes.search).handler(async ({ input, context }) => {
      return this.notesService.search(context.user.id, input.q);
    });
  }

  @Implement(contract.notes.findOne)
  findOne() {
    return authed(contract.notes.findOne).handler(async ({ input, context }) => {
      return this.notesService.findOne(context.user.id, input.id);
    });
  }

  @Implement(contract.notes.update)
  update() {
    return authed(contract.notes.update).handler(async ({ input, context }) => {
      const { id, ...updateData } = input;
      return this.notesService.update(context.user.id, id, updateData);
    });
  }

  @Implement(contract.notes.delete)
  delete() {
    return authed(contract.notes.delete).handler(async ({ input, context }) => {
      await this.notesService.delete(context.user.id, input.id);
      return { success: true as const };
    });
  }
}
