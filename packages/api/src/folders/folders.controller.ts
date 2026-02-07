import { Controller } from "@nestjs/common";
import { Implement } from "@orpc/nest";
import { contract } from "@k7notes/contracts";
import { authed } from "../auth/auth.middleware.js";
import { FoldersService } from "./folders.service.js";

@Controller()
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Implement(contract.folders.create)
  create() {
    return authed(contract.folders.create).handler(async ({ input, context }) => {
      return this.foldersService.create(context.user.id, input);
    });
  }

  @Implement(contract.folders.list)
  list() {
    return authed(contract.folders.list).handler(async ({ input, context }) => {
      return this.foldersService.findAll(context.user.id, input.parentId);
    });
  }

  @Implement(contract.folders.getContents)
  getContents() {
    return authed(contract.folders.getContents).handler(async ({ input, context }) => {
      // Convert undefined to null for root folder
      const folderId = input.folderId === undefined ? null : input.folderId;
      return this.foldersService.getContents(context.user.id, folderId);
    });
  }

  @Implement(contract.folders.getPath)
  getPath() {
    return authed(contract.folders.getPath).handler(async ({ input, context }) => {
      return this.foldersService.getPath(context.user.id, input.id);
    });
  }

  @Implement(contract.folders.findOne)
  findOne() {
    return authed(contract.folders.findOne).handler(async ({ input, context }) => {
      return this.foldersService.findOne(context.user.id, input.id);
    });
  }

  @Implement(contract.folders.update)
  update() {
    return authed(contract.folders.update).handler(async ({ input, context }) => {
      const { id, ...updateData } = input;
      return this.foldersService.update(context.user.id, id, updateData);
    });
  }

  @Implement(contract.folders.delete)
  delete() {
    return authed(contract.folders.delete).handler(async ({ input, context }) => {
      await this.foldersService.delete(context.user.id, input.id);
      return { success: true as const };
    });
  }
}
