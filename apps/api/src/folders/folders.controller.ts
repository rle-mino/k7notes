import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { AuthGuard, AuthenticatedRequest } from "../auth/auth.guard";
import {
  FoldersService,
  CreateFolderDto,
  UpdateFolderDto,
} from "./folders.service";

@Controller("api/folders")
@UseGuards(AuthGuard)
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateFolderDto,
  ) {
    return this.foldersService.create(req.user.id, dto);
  }

  @Get("contents")
  async getContents(
    @Req() req: AuthenticatedRequest,
    @Query("folderId") folderId?: string,
  ) {
    // Convert "null" string to null, undefined to null (root)
    const parsedFolderId =
      folderId === "null" || folderId === undefined ? null : folderId;
    return this.foldersService.getContents(req.user.id, parsedFolderId);
  }

  @Get(":id/path")
  async getPath(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.foldersService.getPath(req.user.id, id);
  }

  @Get(":id")
  async findOne(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.foldersService.findOne(req.user.id, id);
  }

  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query("parentId") parentId?: string,
  ) {
    // Convert "null" string to null, undefined stays undefined
    const parsedParentId =
      parentId === "null" ? null : parentId === undefined ? undefined : parentId;
    return this.foldersService.findAll(req.user.id, parsedParentId);
  }

  @Put(":id")
  async update(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: UpdateFolderDto,
  ) {
    return this.foldersService.update(req.user.id, id, dto);
  }

  @Delete(":id")
  async delete(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    await this.foldersService.delete(req.user.id, id);
    return { success: true };
  }
}
