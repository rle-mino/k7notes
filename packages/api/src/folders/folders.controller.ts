import { Controller, UseGuards } from "@nestjs/common";
import { Implement, implement } from "@orpc/nest";
import { contract } from "@k7notes/contracts";
import { AuthGuard, AuthenticatedRequest } from "../auth/auth.guard.js";
import { FoldersService } from "./folders.service.js";

@Controller()
@UseGuards(AuthGuard)
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Implement(contract.folders.create)
  create() {
    return implement(contract.folders.create).handler(async ({ input, context }) => {
      const req = context.request as unknown as AuthenticatedRequest;
      return this.foldersService.create(req.user.id, input);
    });
  }

  @Implement(contract.folders.list)
  list() {
    return implement(contract.folders.list).handler(async ({ input, context }) => {
      const req = context.request as unknown as AuthenticatedRequest;
      return this.foldersService.findAll(req.user.id, input.parentId);
    });
  }

  @Implement(contract.folders.getContents)
  getContents() {
    return implement(contract.folders.getContents).handler(async ({ input, context }) => {
      const req = context.request as unknown as AuthenticatedRequest;
      // Convert undefined to null for root folder
      const folderId = input.folderId === undefined ? null : input.folderId;
      return this.foldersService.getContents(req.user.id, folderId);
    });
  }

  @Implement(contract.folders.getPath)
  getPath() {
    return implement(contract.folders.getPath).handler(async ({ input, context }) => {
      const req = context.request as unknown as AuthenticatedRequest;
      return this.foldersService.getPath(req.user.id, input.id);
    });
  }

  @Implement(contract.folders.findOne)
  findOne() {
    return implement(contract.folders.findOne).handler(async ({ input, context }) => {
      const req = context.request as unknown as AuthenticatedRequest;
      return this.foldersService.findOne(req.user.id, input.id);
    });
  }

  @Implement(contract.folders.update)
  update() {
    return implement(contract.folders.update).handler(async ({ input, context }) => {
      const req = context.request as unknown as AuthenticatedRequest;
      const { id, ...updateData } = input;
      return this.foldersService.update(req.user.id, id, updateData);
    });
  }

  @Implement(contract.folders.delete)
  delete() {
    return implement(contract.folders.delete).handler(async ({ input, context }) => {
      const req = context.request as unknown as AuthenticatedRequest;
      await this.foldersService.delete(req.user.id, input.id);
      return { success: true as const };
    });
  }
}
