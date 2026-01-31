---
phase: 02-core-note-taking
plan: 02
subsystem: database
tags: [drizzle-orm, crud, reactive-queries, expo-sqlite, local-first]

# Dependency graph
requires:
  - phase: 02-01
    provides: SQLite database with Drizzle ORM and schema
provides:
  - Note CRUD operations (create, read, list, update, delete, move)
  - Folder CRUD operations with hierarchy support
  - useLiveQuery hook for reactive data subscriptions
  - getFolderContents for combined folder/note listing
  - getFolderPath for breadcrumb navigation
affects: [02-03, 02-04, 02-05, 02-06]

# Tech tracking
tech-stack:
  added: []
  patterns: [reactive queries with database change listener, adjacency list traversal for breadcrumbs]

key-files:
  created:
    - apps/mobile/db/queries/notes.ts
    - apps/mobile/db/queries/folders.ts
    - apps/mobile/db/queries/index.ts
    - apps/mobile/db/hooks/useLiveQuery.ts
    - apps/mobile/db/hooks/index.ts
  modified:
    - apps/mobile/db/index.ts

key-decisions:
  - "useLiveQuery uses global change listener - re-fetches on any table change"
  - "UUID generation using Math.random RFC4122 v4 pattern"
  - "Notes ordered by updatedAt descending (most recent first)"
  - "Folders ordered by name alphabetically"
  - "getFolderPath uses recursive lookup (simple, works for shallow nesting)"

patterns-established:
  - "Query functions return typed Drizzle results"
  - "Null handling for root-level items (folderId/parentId = null)"
  - "Update functions return refreshed entity after mutation"

# Metrics
duration: 3min
completed: 2026-01-31
---

# Phase 02 Plan 02: Note and Folder CRUD Operations Summary

Type-safe Drizzle query functions for notes and folders with reactive useLiveQuery hook for automatic UI updates.

## What Was Built

### useLiveQuery Hook
Reactive data hook that subscribes to expo-sqlite's database change listener:
- Wraps any async query function
- Automatically re-fetches when any database table changes
- Returns `{ data, loading, error, refetch }`
- Supports additional dependency array for manual re-fetch triggers

### Note CRUD Functions
Complete note operations via Drizzle ORM:
- `createNote({ title, content?, folderId? })` - Create with UUID
- `getNote(id)` - Fetch single note by ID
- `listNotes(folderId?)` - List notes in folder (null = root)
- `listAllNotes()` - All notes for search
- `updateNote(id, { title?, content?, folderId? })` - Partial update
- `deleteNote(id)` - Remove note
- `moveNote(id, folderId)` - Change folder

### Folder CRUD Functions
Complete folder operations with hierarchy support:
- `createFolder({ name, parentId? })` - Create with UUID
- `getFolder(id)` - Fetch single folder by ID
- `listFolders(parentId?)` - List folders in parent (null = root)
- `listAllFolders()` - All folders for picker dialogs
- `updateFolder(id, { name?, parentId? })` - Partial update
- `deleteFolder(id)` - Remove folder (cascades to subfolders)
- `getFolderContents(folderId)` - Returns `{ folders: [], notes: [] }`
- `getFolderPath(folderId)` - Breadcrumb array from root

## Task Execution

| Task | Name | Commit | Status |
|------|------|--------|--------|
| 1 | Create useLiveQuery hook | c7f57ea | Complete |
| 2 | Create note CRUD functions | 7a7eeb4 | Complete |
| 3 | Create folder CRUD functions | a8df29f | Complete |

## Technical Decisions

### useLiveQuery Global Listener
The expo-sqlite `addDatabaseChangeListener` fires on any table change when `enableChangeListener: true`. This means useLiveQuery re-fetches on ALL database changes, not just the queried table. This is acceptable for local-first with small datasets; optimization can add table filtering later if needed.

### UUID Generation
Using Math.random-based UUID v4 generation rather than adding a uuid package dependency. Works for local-first where UUIDs don't need cryptographic strength.

### Null for Root Level
Both `folderId` on notes and `parentId` on folders use `null` to indicate root level. Query functions handle null explicitly with `isNull()` Drizzle predicate.

## Deviations from Plan

### [Rule 1 - Bug] Fixed expo-sqlite addDatabaseChangeListener API
- **Found during:** Task 1
- **Issue:** Plan specified `addDatabaseChangeListener(expo, callback)` but the actual API is `addDatabaseChangeListener(callback)` - it listens globally to all databases with change listeners enabled
- **Fix:** Removed expo parameter from call, updated JSDoc comment
- **Files modified:** apps/mobile/db/hooks/useLiveQuery.ts
- **Commit:** c7f57ea

### [Rule 1 - Bug] Fixed TypeScript type inference in createFolder return
- **Found during:** Task 3
- **Issue:** Spread operator `{ ...newFolder, ... }` inferred `parentId` as `string | null | undefined` but Folder type requires `string | null`
- **Fix:** Explicitly construct return object with `parentId: newFolder.parentId ?? null`
- **Files modified:** apps/mobile/db/queries/folders.ts
- **Commit:** a8df29f

## Verification Results

All verification criteria passed:
- [x] `pnpm --filter @k7notes/mobile type-check` passes
- [x] All query functions export correctly from apps/mobile/db/index.ts
- [x] useLiveQuery hook subscribes to database changes
- [x] Type inference works for Note and Folder types

## Next Phase Readiness

**Ready for 02-03 (Full-Text Search):**
- Note and folder queries available for search UI
- useLiveQuery ready for search results display

**Ready for 02-04 (Note Editor UI):**
- createNote, updateNote, deleteNote functions available
- useLiveQuery ready for real-time note updates
