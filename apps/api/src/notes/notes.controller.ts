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
  NotesService,
  CreateNoteDto,
  UpdateNoteDto,
} from "./notes.service";

@Controller("api/notes")
@UseGuards(AuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateNoteDto,
  ) {
    return this.notesService.create(req.user.id, dto);
  }

  @Get("search")
  async search(
    @Req() req: AuthenticatedRequest,
    @Query("q") query: string,
  ) {
    return this.notesService.search(req.user.id, query || "");
  }

  @Get(":id")
  async findOne(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.notesService.findOne(req.user.id, id);
  }

  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query("folderId") folderId?: string,
  ) {
    // Convert "null" string to null, undefined stays undefined
    const parsedFolderId =
      folderId === "null" ? null : folderId === undefined ? undefined : folderId;
    return this.notesService.findAll(req.user.id, parsedFolderId);
  }

  @Put(":id")
  async update(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: UpdateNoteDto,
  ) {
    return this.notesService.update(req.user.id, id, dto);
  }

  @Delete(":id")
  async delete(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    await this.notesService.delete(req.user.id, id);
    return { success: true };
  }
}
