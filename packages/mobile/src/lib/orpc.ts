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
import type {
  Note as ContractNote,
  Folder as ContractFolder,
  SearchResult as ContractSearchResult,
  FolderContentsResponse as ContractFolderContents,
  CalendarConnection as ContractCalendarConnection,
  CalendarEvent as ContractCalendarEvent,
  CalendarInfo as ContractCalendarInfo,
  OAuthUrlResponse as ContractOAuthUrlResponse,
} from "@k7notes/contracts";
import { getApiUrl } from "./api";
import * as SecureStore from "expo-secure-store";

// Storage key matching the better-auth expo client configuration
const AUTH_COOKIE_KEY = "k7notes_auth_cookie";

/**
 * Get the auth cookie from SecureStore (same format as better-auth expo client)
 */
function getAuthCookie(): string {
  try {
    const storedCookie = SecureStore.getItem(AUTH_COOKIE_KEY);
    if (!storedCookie) return "";

    const parsed = JSON.parse(storedCookie);
    const cookieString = Object.entries(parsed).reduce(
      (acc, [key, value]) => {
        const cookieValue = value as { value: string; expires?: string };
        // Skip expired cookies
        if (
          cookieValue.expires &&
          new Date(cookieValue.expires) < new Date()
        ) {
          return acc;
        }
        return acc ? `${acc}; ${key}=${cookieValue.value}` : `${key}=${cookieValue.value}`;
      },
      ""
    );
    return cookieString;
  } catch {
    return "";
  }
}

// Create OpenAPI link that maps contract routes to HTTP requests
const link = new OpenAPILink(contract, {
  url: getApiUrl(),
  fetch: (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);

    // Set Content-Type for requests with body
    if (init?.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    // Add auth cookie from SecureStore
    const cookie = getAuthCookie();
    if (cookie) {
      headers.set("Cookie", cookie);
    }

    return fetch(input, {
      ...init,
      headers,
      credentials: "include",
    });
  },
});

// Create type-safe oRPC client
export const orpc: JsonifiedClient<ContractRouterClient<typeof contract>> =
  createORPCClient(link);

// JSON-serialized types (Date becomes string over the wire)
type Jsonify<T> = T extends Date
  ? string
  : T extends object
    ? { [K in keyof T]: Jsonify<T[K]> }
    : T;

// Re-export types with Date fields converted to strings for JSON responses
export type Note = Jsonify<ContractNote>;
export type Folder = Jsonify<ContractFolder>;
export type SearchResult = Jsonify<ContractSearchResult>;
export type FolderContents = Jsonify<ContractFolderContents>;
export type CalendarConnection = Jsonify<ContractCalendarConnection>;
export type CalendarEvent = Jsonify<ContractCalendarEvent>;
export type CalendarInfo = Jsonify<ContractCalendarInfo>;
export type OAuthUrlResponse = Jsonify<ContractOAuthUrlResponse>;

// Re-export input types (these don't need jsonification)
export type {
  CreateNote,
  UpdateNote,
  CreateFolder,
  UpdateFolder,
  FolderPathItem,
  CalendarProvider,
  ConnectCalendar,
  ListCalendarEvents,
} from "@k7notes/contracts";
