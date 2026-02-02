import { Controller, UseGuards } from "@nestjs/common";
import { Implement, implement } from "@orpc/nest";
import { contract } from "@k7notes/contracts";
import { AuthGuard, AuthenticatedRequest } from "../auth/auth.guard.js";
import { NotesService } from "./notes.service.js";

@Controller()
@UseGuards(AuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Implement(contract.notes.create)
  create() {
    return implement(contract.notes.create).handler(async ({ input, context }) => {
      const req = context.request as unknown as AuthenticatedRequest;
      return this.notesService.create(req.user.id, input);
    });
  }

  @Implement(contract.notes.list)
  list() {
    return implement(contract.notes.list).handler(async ({ input, context }) => {
      const req = context.request as unknown as AuthenticatedRequest;
      return this.notesService.findAll(req.user.id, input.folderId);
    });
  }

  @Implement(contract.notes.search)
  search() {
    return implement(contract.notes.search).handler(async ({ input, context }) => {
      const req = context.request as unknown as AuthenticatedRequest;
      return this.notesService.search(req.user.id, input.q);
    });
  }

  @Implement(contract.notes.findOne)
  findOne() {
    return implement(contract.notes.findOne).handler(async ({ input, context }) => {
      const req = context.request as unknown as AuthenticatedRequest;
      return this.notesService.findOne(req.user.id, input.id);
    });
  }

  @Implement(contract.notes.update)
  update() {
    return implement(contract.notes.update).handler(async ({ input, context }) => {
      const req = context.request as unknown as AuthenticatedRequest;
      const { id, ...updateData } = input;
      return this.notesService.update(req.user.id, id, updateData);
    });
  }

  @Implement(contract.notes.delete)
  delete() {
    return implement(contract.notes.delete).handler(async ({ input, context }) => {
      const req = context.request as unknown as AuthenticatedRequest;
      await this.notesService.delete(req.user.id, input.id);
      return { success: true as const };
    });
  }
}
