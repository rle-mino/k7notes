# Plan: Daily Notes Calendar Integration

## Context

The codebase already has:
- **Calendar infrastructure**: Full OAuth flow, Google/Microsoft providers, `calendarConnections` table, `CalendarEventSchema`, and API endpoints for listing events by date range
- **Notes system**: Notes table with `id`, `userId`, `title`, `content`, `folderId`, `createdAt`, `updatedAt`. No `kind` field yet
- **Default "Daily" folder**: Created on signup via `createDefaultFolders()`
- **Folder hierarchy**: Self-referencing `parentId` with cascade deletes, lazy-loaded tree UI
- **oRPC contracts**: Typed end-to-end with Zod validation
- **Note editor**: TenTap with markdown support, autosave (5s debounce)
- **CreateNoteModal**: Prompts for title + optional folder, navigates to `/notes/{id}` after creation

Key files:
- `packages/api/src/db/schema.ts` - Database schema
- `packages/api/src/notes/notes.service.ts` - Notes CRUD
- `packages/api/src/folders/folders.service.ts` - Folder CRUD + `createDefaultFolders()`
- `packages/contracts/src/contracts/notes.ts` - Notes contract
- `packages/contracts/src/schemas/notes.ts` - Notes Zod schemas
- `packages/mobile/src/components/notes/CreateNoteModal.tsx` - Note creation UI
- `packages/mobile/src/hooks/useTreeData.ts` - Folder tree data
- `packages/mobile/app/(app)/notes/[id].tsx` - Note editor route

## Clarifications

1. **Daily note model**: Add a `kind` field to notes (`REGULAR` | `DAILY`). Daily notes live in the Daily folder with YYYY/MM/DD subfolder hierarchy
2. **Event display**: Auto-generated markdown sections (`## 10:00 - Meeting Name`) inserted into note content
3. **Note creation**: Auto-create on date selection. User taps "add note" in Daily folder → date picker opens (starting today) → selecting a date creates the note (or navigates to existing one)
4. **Subfolder creation**: Auto-create YYYY → MM → DD subfolders on-demand when daily note is created
5. **Calendar sync**: Events fetched on creation. Manual refresh button to re-sync (adds new events without removing existing content)
6. **No calendar**: Daily notes work without calendar — just an empty note with a date heading
7. **Navigation**: No new tab. The Daily folder's "add note" action opens a date picker instead of the regular CreateNoteModal

## Completion Conditions

| Condition | Validation Command | Expected Outcome |
|-----------|-------------------|------------------|
| Type check | `pnpm type-check` | Exit code 0, no errors |
| Lint | `pnpm lint` | Exit code 0, no warnings |
| Build | `pnpm build` | Exit code 0, successful build |
| QA test | `/qa` skill | Manual QA: create daily note without calendar, verify folder structure, verify note content |

## Execution Steps

| Step | Phases | Description |
|------|--------|-------------|
| 1    | 1, 2   | Schema changes (kind field) and folder service (auto-create hierarchy) are independent |
| 2    | 3      | Daily notes service depends on schema + folder hierarchy |
| 3    | 4      | Contract depends on service design |
| 4    | 5      | Controller depends on contract |
| 5    | 6      | Frontend date picker depends on backend API being ready |
| 6    | 7      | Calendar sync depends on daily note creation flow working |
| 7    | 8      | QA testing depends on everything |

> **Parallelism**: Phases within the same step can run in parallel (max 4).

## Phases

### ⬜ Phase 1: Add `kind` field to notes schema
- **Step**: 1
- **Complexity**: 2
- [ ] Add `noteKind` enum type to schema (`REGULAR`, `DAILY`)
- [ ] Add `kind` column to notes table (default `REGULAR`)
- [ ] Add `date` column to notes table (nullable, text ISO date `YYYY-MM-DD`) — used for daily notes to identify the date
- [ ] Add unique constraint on `(userId, kind, date)` to prevent duplicate daily notes per date
- [ ] Update `NoteSchema` and `CreateNoteSchema` in contracts to include `kind` and `date` fields
- [ ] Push schema changes with `db:push`
- **Files**: `packages/api/src/db/schema.ts`, `packages/contracts/src/schemas/notes.ts`
- **Commit message**: `feat: add kind and date fields to notes schema`
- **Bisect note**: Schema change only — no consumers yet, existing code unaffected since `kind` defaults to `REGULAR`

### ⬜ Phase 2: Add folder hierarchy auto-creation service
- **Step**: 1
- **Complexity**: 3
- [ ] Add `findByName(userId, name, parentId)` method to `FoldersService` — finds folder by name within a parent
- [ ] Add `findOrCreatePath(userId, path: string[])` method to `FoldersService` — takes array like `["Daily", "2026", "01", "15"]` and creates any missing folders, returns the leaf folder
- [ ] Write unit tests for `findOrCreatePath` logic
- **Files**: `packages/api/src/folders/folders.service.ts`, `packages/api/src/folders/folders.service.spec.ts` (if exists, or create)
- **Commit message**: `feat: add folder hierarchy auto-creation service`
- **Bisect note**: New methods only, no existing behavior changed

### ⬜ Phase 3: Implement daily notes service
- **Step**: 2
- **Complexity**: 4
- [ ] Add `createDailyNote(userId, date: string)` to `NotesService`:
  - Parse date string to get year/month/day
  - Call `foldersService.findOrCreatePath(userId, ["Daily", year, month, day])`
  - Check if daily note already exists for this date (via unique constraint or query)
  - If exists, return existing note
  - If not, fetch calendar events (if any connections exist) via `CalendarService.listEvents()`
  - Generate markdown content with event sections: `## HH:MM - Event Title\n\n`
  - Create note with `kind: 'DAILY'`, `date`, `title: YYYY-MM-DD`, `folderId: leafFolder.id`
- [ ] Add `refreshDailyNoteEvents(userId, noteId)` to `NotesService`:
  - Fetch current note content
  - Fetch calendar events for the note's date
  - Parse existing content to find event sections
  - Add any new events not already present (match by event title + time)
  - Update note content
- [ ] Add `findDailyNote(userId, date: string)` to `NotesService` — simple query by kind + date
- [ ] Inject `FoldersService` and `CalendarService` into `NotesService` (or create a new `DailyNotesService`)
- **Files**: `packages/api/src/notes/notes.service.ts` (or new `packages/api/src/notes/daily-notes.service.ts`), `packages/api/src/notes/notes.module.ts`
- **Commit message**: `feat: implement daily notes service with calendar integration`
- **Bisect note**: Depends on Phase 1 (kind field) and Phase 2 (folder hierarchy). New service methods only.

### ⬜ Phase 4: Add daily notes oRPC contracts
- **Step**: 3
- **Complexity**: 2
- [ ] Add `getOrCreateDailyNote` contract — input: `{ date: string }`, output: `NoteSchema`
- [ ] Add `refreshDailyNoteEvents` contract — input: `{ noteId: string }`, output: `NoteSchema`
- [ ] Add contracts to the notes contract or create a new `dailyNotes` contract group
- **Files**: `packages/contracts/src/contracts/notes.ts` (or new `daily-notes.ts`), `packages/contracts/src/index.ts`
- **Commit message**: `feat: add daily notes oRPC contracts`
- **Bisect note**: Contract definitions only, no implementation yet. Must export from contracts index.

### ⬜ Phase 5: Implement daily notes controller endpoints
- **Step**: 4
- **Complexity**: 2
- [ ] Implement `getOrCreateDailyNote` endpoint using `@Implement` decorator
- [ ] Implement `refreshDailyNoteEvents` endpoint using `@Implement` decorator
- [ ] Register controller in NestJS module
- **Files**: `packages/api/src/notes/notes.controller.ts` (or new `daily-notes.controller.ts`), `packages/api/src/notes/notes.module.ts`
- **Commit message**: `feat: implement daily notes API endpoints`
- **Bisect note**: Depends on Phase 3 (service) and Phase 4 (contracts)

### ⬜ Phase 6: Add date picker and daily note creation flow in mobile
- **Step**: 5
- **Complexity**: 4
- [ ] Create `DailyNoteDatePicker` component — modal with calendar/date picker UI (start on today's date)
- [ ] Modify the "add note" action in the Daily folder tree item to open `DailyNoteDatePicker` instead of `CreateNoteModal`
- [ ] On date selection: call `orpc.notes.getOrCreateDailyNote({ date })` → navigate to `/notes/{id}`
- [ ] Detect "Daily" folder in tree data to show different add-note behavior (by folder name or a known convention)
- [ ] Handle loading state while creating note + folders
- **Files**: `packages/mobile/src/components/daily/DailyNoteDatePicker.tsx` (new), `packages/mobile/src/hooks/useTreeData.ts`, `packages/mobile/src/components/notes/TreeItem.tsx` or `packages/mobile/app/(app)/notes/index.tsx`
- **Commit message**: `feat: add date picker for daily note creation`
- **Bisect note**: Depends on Phase 5 (API endpoints). New component + modified tree behavior.

### ⬜ Phase 7: Add calendar refresh button to daily note editor
- **Step**: 6
- **Complexity**: 3
- [ ] Detect when editing a daily note (check `kind === 'DAILY'`) in the note editor route
- [ ] Show a "Refresh Calendar" button in the header/toolbar for daily notes
- [ ] On tap: call `orpc.notes.refreshDailyNoteEvents({ noteId })` → update editor content
- [ ] Handle case where no calendar is connected (show informational message or hide button)
- [ ] Show loading indicator during refresh
- **Files**: `packages/mobile/app/(app)/notes/[id].tsx`, possibly a new `DailyNoteToolbar` component
- **Commit message**: `feat: add calendar refresh button to daily note editor`
- **Bisect note**: Depends on Phase 5 (refresh endpoint) and Phase 6 (daily notes being creatable)

### ⬜ Phase 8: QA testing
- **Step**: 7
- **Complexity**: 2
- [ ] Start dev servers and test on web
- [ ] Create a daily note for today (no calendar connected) — verify folder structure YYYY/MM/DD appears under Daily
- [ ] Verify note opens in editor with date heading
- [ ] Create daily note for same date again — verify it navigates to existing note (no duplicate)
- [ ] Create daily note for a different date — verify separate note and folder structure
- [ ] Verify the refresh button appears on daily notes but not regular notes
- [ ] Verify regular note creation still works normally
- **Files**: None (testing only)
- **Commit message**: N/A (no code changes)
- **Bisect note**: N/A

## Phase Status Legend

| Emoji | Status |
|-------|--------|
| ⬜ | Not started |
| 🔄 | In progress |
| ✅ | Completed |

## Current Status
- **Current Phase**: Not started
- **Progress**: 0/8
