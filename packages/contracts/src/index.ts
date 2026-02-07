// Re-export contracts
export { contract, notesContract, foldersContract, calendarContract, transcriptionsContract, preferencesContract } from "./contracts/index";
export type { Contract } from "./contracts/index";

// Re-export schemas
export {
  IdParamSchema,
  SuccessResponseSchema,
} from "./schemas/common";
export type { IdParam, SuccessResponse } from "./schemas/common";

export {
  NoteKindSchema,
  NoteSchema,
  CreateNoteSchema,
  UpdateNoteSchema,
  ListNotesQuerySchema,
  SearchNotesSchema,
  SearchResultSchema,
  GetOrCreateDailyNoteSchema,
  RefreshDailyNoteEventsSchema,
} from "./schemas/note";
export type {
  NoteKind,
  Note,
  CreateNote,
  UpdateNote,
  ListNotesQuery,
  SearchNotes,
  SearchResult,
  GetOrCreateDailyNote,
  RefreshDailyNoteEvents,
} from "./schemas/note";

export {
  FolderSchema,
  CreateFolderSchema,
  UpdateFolderSchema,
  ListFoldersQuerySchema,
  FolderContentsQuerySchema,
  FolderContentsResponseSchema,
  FolderPathItemSchema,
} from "./schemas/folder";
export type {
  Folder,
  CreateFolder,
  UpdateFolder,
  ListFoldersQuery,
  FolderContentsQuery,
  FolderContentsResponse,
  FolderPathItem,
} from "./schemas/folder";

export {
  CalendarProviderSchema,
  CalendarConnectionSchema,
  ConnectCalendarSchema,
  CalendarOAuthCallbackSchema,
  CalendarEventSchema,
  ListCalendarEventsSchema,
  CalendarInfoSchema,
  ListCalendarsSchema,
  OAuthUrlResponseSchema,
  DisconnectCalendarSchema,
} from "./schemas/calendar";
export type {
  CalendarProvider,
  CalendarConnection,
  ConnectCalendar,
  CalendarOAuthCallback,
  CalendarEvent,
  ListCalendarEvents,
  CalendarInfo,
  ListCalendars,
  OAuthUrlResponse,
  DisconnectCalendar,
} from "./schemas/calendar";

export {
  TranscriptionProviderSchema,
  TranscriptionSegmentSchema,
  TranscriptionResultSchema,
  TranscriptionOptionsSchema,
  TranscribeRequestSchema,
  TranscribeResponseSchema,
  ProviderInfoSchema,
  ListProvidersResponseSchema,
  LinkToNoteRequestSchema,
  LinkToNoteResponseSchema,
  TranscriptionListItemSchema,
  ListTranscriptionsResponseSchema,
  UpdateTranscriptionTitleRequestSchema,
  UpdateTranscriptionTitleResponseSchema,
} from "./schemas/transcription";
export type {
  TranscriptionProviderType,
  TranscriptionSegment,
  TranscriptionResult,
  TranscriptionOptions,
  TranscribeRequest,
  TranscribeResponse,
  ProviderInfo,
  ListProvidersResponse,
  LinkToNoteRequest,
  LinkToNoteResponse,
  TranscriptionListItem,
  ListTranscriptionsResponse,
  UpdateTranscriptionTitleRequest,
  UpdateTranscriptionTitleResponse,
} from "./schemas/transcription";

export {
  SUPPORTED_LANGUAGES,
  SupportedLanguageSchema,
  UserPreferencesSchema,
  GetPreferencesInputSchema,
  UpdatePreferencesSchema,
} from "./schemas/preferences";
export type {
  SupportedLanguage,
  UserPreferences,
  GetPreferencesInput,
  UpdatePreferences,
} from "./schemas/preferences";
