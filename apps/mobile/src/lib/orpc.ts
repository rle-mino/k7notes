/**
 * oRPC client for type-safe API calls
 *
 * Import this module only when you need to make API calls.
 */

import { createORPCClient } from "@orpc/client";
import { OpenAPILink } from "@orpc/openapi-client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import type { JsonifiedClient } from "@orpc/openapi-client";
import { contract } from "@k7notes/contracts";
import { getApiUrl } from "./api";

// Create OpenAPI link that maps contract routes to HTTP requests
const link = new OpenAPILink(contract, {
  url: getApiUrl(),
  fetch: (input: RequestInfo | URL, init?: RequestInit) =>
    fetch(input, {
      ...init,
      credentials: "include", // Include cookies for auth
    }),
});

// Create type-safe oRPC client
export const orpc: JsonifiedClient<ContractRouterClient<typeof contract>> =
  createORPCClient(link);

// Re-export types
export type {
  Note,
  CreateNote,
  UpdateNote,
  SearchResult,
  Folder,
  CreateFolder,
  UpdateFolder,
  FolderContentsResponse as FolderContents,
  FolderPathItem,
} from "@k7notes/contracts";
