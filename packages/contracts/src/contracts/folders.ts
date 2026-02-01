import { oc } from "@orpc/contract";
import { z } from "zod";
import {
  FolderSchema,
  CreateFolderSchema,
  UpdateFolderSchema,
  ListFoldersQuerySchema,
  FolderContentsQuerySchema,
  FolderContentsResponseSchema,
  FolderPathItemSchema,
} from "../schemas/folder";
import { IdParamSchema, SuccessResponseSchema } from "../schemas/common";

export const foldersContract = {
  create: oc
    .route({ method: "POST", path: "/api/folders" })
    .input(CreateFolderSchema)
    .output(FolderSchema),

  list: oc
    .route({ method: "GET", path: "/api/folders" })
    .input(ListFoldersQuerySchema)
    .output(z.array(FolderSchema)),

  findOne: oc
    .route({ method: "GET", path: "/api/folders/{id}" })
    .input(IdParamSchema)
    .output(FolderSchema),

  update: oc
    .route({ method: "PUT", path: "/api/folders/{id}" })
    .input(IdParamSchema.merge(UpdateFolderSchema))
    .output(FolderSchema),

  delete: oc
    .route({ method: "DELETE", path: "/api/folders/{id}" })
    .input(IdParamSchema)
    .output(SuccessResponseSchema),

  getContents: oc
    .route({ method: "GET", path: "/api/folders/contents" })
    .input(FolderContentsQuerySchema)
    .output(FolderContentsResponseSchema),

  getPath: oc
    .route({ method: "GET", path: "/api/folders/{id}/path" })
    .input(IdParamSchema)
    .output(z.array(FolderPathItemSchema)),
};
