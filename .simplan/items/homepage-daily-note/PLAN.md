# Plan: Homepage should be the current daily note

## Context

The app currently redirects to `/(app)/notes` (the notes list) on launch via `packages/mobile/app/index.tsx`. The daily notes system is fully implemented:
- `getOrCreateDailyNote` API creates/returns today's daily note
- `DailyNotesService` handles creation with folder hierarchy (`Daily/YYYY/MM/DD`)
- The note editor at `/(app)/notes/[id]` already supports daily notes with refresh button

The approach is to change the app's initial redirect from the notes list to today's daily note. On launch, we call `getOrCreateDailyNote` with today's date and navigate to that note's editor. If it fails, we fall back to the notes list.

Both mobile (`_layout.tsx` with Tabs) and web (`_layout.web.tsx` with Sidebar+Stack) layouts need updating. The Notes tab remains accessible for browsing.

E2E tests wait for `**/notes**` in URLs after login/signup. Since daily notes navigate to `/notes/{id}`, this pattern still matches — no E2E changes needed.

## Clarifications

- **Homepage behavior**: Replace the default notes list view. Opening the app lands on today's daily note editor (auto-created if needed). Notes list is still accessible via tab.
- **Platform scope**: Both web and mobile.
- **Error handling**: Fall back to notes list with an error toast if daily note creation fails.
- **Navigation**: Notes tab still exists. Users can navigate back to notes list via tab bar (mobile) or sidebar (web).

## Completion Conditions

| Condition | Validation Command | Expected Outcome |
|-----------|-------------------|------------------|
| Type check | `pnpm type-check` | No errors |
| Lint | `pnpm lint` | No errors |
| E2E tests | `cd packages/e2e && npx playwright test` | All tests pass |

## Execution Steps

| Step | Phases | Description |
|------|--------|-------------|
| 1    | 1      | Create the hook that handles daily note auto-open logic |
| 2    | 2, 3   | Integrate hook into both mobile and web layouts (independent files) |

> **Parallelism**: Phases 2 and 3 can run in parallel (different layout files, same hook dependency from Phase 1).

## Phases

### ⬜ Phase 1: Create useDailyNoteRedirect hook
- **Step**: 1
- **Complexity**: 3
- [ ] Create a new hook `useDailyNoteRedirect` in `packages/mobile/src/hooks/useDailyNoteRedirect.ts`
- [ ] The hook should: (1) call `getOrCreateDailyNote` with today's date (YYYY-MM-DD) on mount, (2) navigate to `/(app)/notes/{id}` on success, (3) navigate to `/(app)/notes` on failure (fallback)
- [ ] Accept a `ready` boolean parameter so layouts can delay until auth session is confirmed
- [ ] Return `{ isRedirecting: boolean }` so layouts can show loading state while the redirect is in progress
- [ ] Use `router.replace` (not `push`) to avoid back-button issues
- [ ] Only trigger once per app mount (use a ref to track)
- **Files**: `packages/mobile/src/hooks/useDailyNoteRedirect.ts`
- **Commit message**: `feat: add useDailyNoteRedirect hook for auto-opening today's daily note`
- **Bisect note**: Hook is self-contained; no callers yet so no broken state.

### ⬜ Phase 2: Integrate hook into mobile layout
- **Step**: 2
- **Complexity**: 2
- [ ] Import and call `useDailyNoteRedirect` in `packages/mobile/app/(app)/_layout.tsx`
- [ ] Pass `ready: !!session?.user` so it only fires after auth is confirmed
- [ ] Show loading spinner while `isRedirecting` is true (reuse existing loading UI)
- [ ] Remove the `home` hidden screen registration (it's unused now)
- **Files**: `packages/mobile/app/(app)/_layout.tsx`
- **Commit message**: `feat: auto-open today's daily note on mobile app launch`
- **Bisect note**: N/A

### ⬜ Phase 3: Integrate hook into web layout
- **Step**: 2
- **Complexity**: 2
- [ ] Import and call `useDailyNoteRedirect` in `packages/mobile/app/(app)/_layout.web.tsx`
- [ ] Pass `ready: !!session?.user` so it only fires after auth is confirmed
- [ ] Show loading spinner while `isRedirecting` is true (reuse existing loading UI)
- [ ] Remove the `home` screen registration (it's unused now)
- **Files**: `packages/mobile/app/(app)/_layout.web.tsx`
- **Commit message**: `feat: auto-open today's daily note on web app launch`
- **Bisect note**: N/A

## Phase Status Legend

| Emoji | Status |
|-------|--------|
| ⬜ | Not started |
| 🔄 | In progress |
| ✅ | Completed |

## Current Status
- **Current Phase**: Not started
- **Progress**: 0/3
