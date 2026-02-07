import { oc } from "@orpc/contract";
import { z } from "zod";
import {
  NoteSchema,
  CreateNoteSchema,
  UpdateNoteSchema,
  ListNotesQuerySchema,
  SearchNotesSchema,
  SearchResultSchema,
  GetOrCreateDailyNoteSchema,
  RefreshDailyNoteEventsSchema,
} from "../schemas/note";
import { IdParamSchema, SuccessResponseSchema } from "../schemas/common";

export const notesContract = {
  create: oc
    .route({ method: "POST", path: "/api/notes" })
    .input(CreateNoteSchema)
    .output(NoteSchema),

  list: oc
    .route({ method: "GET", path: "/api/notes" })
    .input(ListNotesQuerySchema)
    .output(z.array(NoteSchema)),

  findOne: oc
    .route({ method: "GET", path: "/api/notes/{id}" })
    .input(IdParamSchema)
    .output(NoteSchema),

  update: oc
    .route({ method: "PUT", path: "/api/notes/{id}" })
    .input(IdParamSchema.merge(UpdateNoteSchema))
    .output(NoteSchema),

  delete: oc
    .route({ method: "DELETE", path: "/api/notes/{id}" })
    .input(IdParamSchema)
    .output(SuccessResponseSchema),

  search: oc
    .route({ method: "GET", path: "/api/notes/search" })
    .input(SearchNotesSchema)
    .output(z.array(SearchResultSchema)),

  // Daily notes
  getOrCreateDailyNote: oc
    .route({ method: "POST", path: "/api/notes/daily" })
    .input(GetOrCreateDailyNoteSchema)
    .output(NoteSchema),

  refreshDailyNoteEvents: oc
    .route({ method: "POST", path: "/api/notes/daily/refresh" })
    .input(RefreshDailyNoteEventsSchema)
    .output(NoteSchema),
};
