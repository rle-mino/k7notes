# Plan: Item #3 - Unit & integration test setup

## Context

The K7Notes monorepo has **zero unit/integration tests**. E2E tests exist via Playwright in `packages/e2e`, but no test runner is configured for API or Mobile packages.

**Backend** (`packages/api`): NestJS 11 with 4 services (Notes, Folders, Calendar, Transcriptions). All services import a module-level `db` singleton directly (`import { db } from "../db/index.js"`), making it impossible to swap the database connection for tests without refactoring.

**Mobile** (`packages/mobile`): React Native 0.76 + Expo SDK 52. Custom hooks (useTreeData, useCalendarConnections) contain testable business logic. Components use React Native primitives.

**Key architectural issue**: The `db` object is created at module scope in `packages/api/src/db/index.ts` using `process.env.DATABASE_URL`. Services import it directly, not via NestJS DI. This must be refactored to enable testcontainers integration tests.

## Clarifications

- **Test runner**: Vitest for both API and Mobile
- **Packages**: API + Mobile (not contracts)
- **DB strategy**: Testcontainers (real PostgreSQL in Docker) for backend integration tests
- **Coverage scope**: Full test coverage for ALL services (Notes, Folders, Calendar, Transcriptions) + mobile hooks
- **DB injection**: Refactor db module to NestJS DI provider (`@Inject(DB_TOKEN)`)

## Completion Conditions

| Condition | Validation Command | Expected Outcome |
|-----------|-------------------|------------------|
| API tests pass | `pnpm turbo test --filter=@k7notes/api` | Exit code 0, all tests green |
| Mobile tests pass | `pnpm turbo test --filter=@k7notes/mobile` | Exit code 0, all tests green |
| Type check passes | `pnpm type-check` | No TypeScript errors |
| Lint passes | `pnpm lint` | No lint errors |

## Execution Steps

| Step | Phases | Description |
|------|--------|-------------|
| 1    | 1, 2   | Vitest configs are independent per package |
| 2    | 3      | DB refactor must complete before any API tests can use testcontainers |
| 3    | 4      | Testcontainers helpers need DI-injectable db |
| 4    | 5, 6, 7 | NotesService, FoldersService tests + mobile hook tests are independent |
| 5    | 8, 9   | CalendarService + TranscriptionsService tests are independent |

> **Parallelism**: Phases within the same step can run in parallel (max 4).

## Phases

### ⬜ Phase 1: API Vitest configuration and turbo pipeline
- **Step**: 1
- **Complexity**: 2
- [ ] Install `vitest` and `@vitest/coverage-v8` as devDependencies in `packages/api`
- [ ] Create `packages/api/vitest.config.ts` with TypeScript support, `src` root, `**/*.spec.ts` pattern
- [ ] Add `"test": "vitest run"` script to `packages/api/package.json`
- [ ] Add `test` task to `turbo.json` (with `dependsOn: ["^build"]`, `cache: false`)
- [ ] Add `"test": "turbo test"` script to root `package.json`
- [ ] Update `packages/api/tsconfig.json` include to cover test files
- **Files**: `packages/api/package.json`, `packages/api/vitest.config.ts`, `turbo.json`, `package.json`, `packages/api/tsconfig.json`
- **Commit message**: `feat: add Vitest config for API and turbo test pipeline`
- **Bisect note**: No tests exist yet, so config-only changes are safe

### ⬜ Phase 2: Mobile Vitest configuration
- **Step**: 1
- **Complexity**: 2
- [ ] Install `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/react-hooks` as devDependencies in `packages/mobile`
- [ ] Create `packages/mobile/vitest.config.ts` with jsdom environment, `src` root, `**/*.test.ts(x)` pattern
- [ ] Configure path alias `@/*` → `./src/*` in vitest config
- [ ] Add `"test": "vitest run"` script to `packages/mobile/package.json`
- **Files**: `packages/mobile/package.json`, `packages/mobile/vitest.config.ts`
- **Commit message**: `feat: add Vitest config for mobile app`
- **Bisect note**: Independent of API config, no test files yet

### ⬜ Phase 3: Refactor db module to NestJS DI provider
- **Step**: 2
- **Complexity**: 4
- [ ] Create `packages/api/src/db/db.module.ts` with a `DatabaseModule` that provides a `DB_TOKEN` injection token
- [ ] Create `packages/api/src/db/db.types.ts` with `DB_TOKEN` constant and `Database` type (return type of `drizzle()`)
- [ ] Update `packages/api/src/db/index.ts` to export the db creation factory (keep backward compat for now)
- [ ] Update `NotesService` to accept `@Inject(DB_TOKEN) private readonly db: Database` in constructor
- [ ] Update `FoldersService` to accept `@Inject(DB_TOKEN) private readonly db: Database` in constructor
- [ ] Update `CalendarService` to accept `@Inject(DB_TOKEN) private readonly db: Database` in constructor
- [ ] Update `TranscriptionsService` to accept `@Inject(DB_TOKEN) private readonly db: Database` in constructor
- [ ] Update all 4 module files to import `DatabaseModule`
- [ ] Update `AppModule` to import `DatabaseModule` as a global module
- [ ] Remove direct `db` imports from all services
- **Files**: `packages/api/src/db/db.module.ts`, `packages/api/src/db/db.types.ts`, `packages/api/src/db/index.ts`, `packages/api/src/notes/notes.service.ts`, `packages/api/src/notes/notes.module.ts`, `packages/api/src/folders/folders.service.ts`, `packages/api/src/folders/folders.module.ts`, `packages/api/src/calendar/calendar.service.ts`, `packages/api/src/calendar/calendar.module.ts`, `packages/api/src/transcriptions/transcriptions.service.ts`, `packages/api/src/transcriptions/transcriptions.module.ts`, `packages/api/src/app.module.ts`
- **Commit message**: `refactor: inject database via NestJS DI for testability`
- **Bisect note**: All services and modules must be updated atomically — partial migration would break imports

### ⬜ Phase 4: Testcontainers setup and test helpers
- **Step**: 3
- **Complexity**: 3
- [ ] Install `testcontainers` and `@testcontainers/postgresql` as devDependencies in `packages/api`
- [ ] Create `packages/api/test/setup.ts` — Vitest globalSetup that starts a PostgreSQL container and sets `DATABASE_URL`
- [ ] Create `packages/api/test/helpers.ts` — Test fixtures: `createTestUser(db)`, `createTestNote(db, userId)`, `createTestFolder(db, userId)`, `cleanupDb(db)`
- [ ] Create `packages/api/test/create-test-module.ts` — Helper that creates a NestJS `TestingModule` with testcontainers db override for `DB_TOKEN`
- [ ] Push schema to test database in globalSetup using Drizzle `migrate` or `push`
- [ ] Update `packages/api/vitest.config.ts` to reference globalSetup and set test timeout (containers can be slow)
- **Files**: `packages/api/test/setup.ts`, `packages/api/test/helpers.ts`, `packages/api/test/create-test-module.ts`, `packages/api/vitest.config.ts`, `packages/api/package.json`
- **Commit message**: `feat: add testcontainers setup and test helpers for API`
- **Bisect note**: Depends on DB_TOKEN from phase 3; no tests call these helpers yet so safe alone

### ⬜ Phase 5: NotesService integration tests
- **Step**: 4
- **Complexity**: 3
- [ ] Create `packages/api/src/notes/notes.service.spec.ts`
- [ ] Test `create` — creates note, sets defaults, returns note with id
- [ ] Test `findOne` — returns note for correct user, throws NotFoundException for wrong user
- [ ] Test `findAll` — returns all notes, filters by folderId, filters root notes (null folderId)
- [ ] Test `update` — updates title, content, folderId; verifies ownership check
- [ ] Test `delete` — deletes note, verifies ownership check
- [ ] Test `search` — PostgreSQL full-text search with ranking, empty query returns empty, partial match with `:*`
- [ ] Test user isolation — user A cannot access user B's notes
- **Files**: `packages/api/src/notes/notes.service.spec.ts`
- **Commit message**: `test: add NotesService integration tests`
- **Bisect note**: N/A

### ⬜ Phase 6: FoldersService integration tests
- **Step**: 4
- **Complexity**: 3
- [ ] Create `packages/api/src/folders/folders.service.spec.ts`
- [ ] Test `create` — creates folder, validates parentId exists, returns folder
- [ ] Test `findOne` — returns folder, throws NotFoundException for wrong user
- [ ] Test `findAll` — returns all folders, filters by parentId, filters root folders
- [ ] Test `update` — updates name, parentId; verifies ownership and parent validation
- [ ] Test `delete` — cascade deletes subfolders, notes get folderId set to null
- [ ] Test `getContents` — returns subfolders + notes for folder, and for root
- [ ] Test `getPath` — walks up tree returning full path
- [ ] Test user isolation — user A cannot access user B's folders
- **Files**: `packages/api/src/folders/folders.service.spec.ts`
- **Commit message**: `test: add FoldersService integration tests`
- **Bisect note**: N/A

### ⬜ Phase 7: Mobile useTreeData hook tests
- **Step**: 4
- **Complexity**: 3
- [ ] Create `packages/mobile/src/hooks/useTreeData.test.ts`
- [ ] Mock `@/lib/orpc` module (vi.mock)
- [ ] Test `fetchRootData` — calls orpc.folders.getContents with null, sets root data
- [ ] Test `buildFlatTree` — correctly flattens folder/note hierarchy with proper depth
- [ ] Test `toggleExpand` — expands folder (fetches contents), collapses folder
- [ ] Test `refresh` — clears expanded state, re-fetches root data
- [ ] Test loading/error states — loading while fetching, error on failure
- [ ] Test "add-item" nodes appear at end of expanded folder children
- **Files**: `packages/mobile/src/hooks/useTreeData.test.ts`
- **Commit message**: `test: add useTreeData hook tests for mobile`
- **Bisect note**: N/A

### ⬜ Phase 8: CalendarService integration tests
- **Step**: 5
- **Complexity**: 3
- [ ] Create `packages/api/src/calendar/calendar.service.spec.ts`
- [ ] Mock `GoogleCalendarProvider` and `MicrosoftCalendarProvider` (use NestJS `TestingModule` overrides)
- [ ] Test `listConnections` — returns connections for user
- [ ] Test `getOAuthUrl` — generates URL with correct state encoding, detects platform from clientScheme
- [ ] Test `handleOAuthCallback` — creates new connection, updates existing connection, validates state userId
- [ ] Test `disconnect` — deletes connection, throws NotFoundException for wrong user
- [ ] Test `listCalendars` — delegates to provider with correct token
- [ ] Test `listEvents` — delegates to provider, defaults calendarId to "primary"
- [ ] Test token refresh flow — refreshes expired token, marks inactive on refresh failure
- **Files**: `packages/api/src/calendar/calendar.service.spec.ts`
- **Commit message**: `test: add CalendarService integration tests`
- **Bisect note**: N/A

### ⬜ Phase 9: TranscriptionsService integration tests
- **Step**: 5
- **Complexity**: 3
- [ ] Create `packages/api/src/transcriptions/transcriptions.service.spec.ts`
- [ ] Mock `OpenAITranscriptionProvider` (use NestJS `TestingModule` overrides)
- [ ] Test `transcribe` — transcribes audio buffer, persists to db, returns result with id
- [ ] Test `transcribeBase64` — decodes base64 and delegates to transcribe
- [ ] Test `linkToNote` — updates transcription with noteId
- [ ] Test `getProviders` — returns list of available providers with metadata
- [ ] Test validation — file too large, unsupported format, provider unavailable
- **Files**: `packages/api/src/transcriptions/transcriptions.service.spec.ts`
- **Commit message**: `test: add TranscriptionsService integration tests`
- **Bisect note**: N/A

## Phase Status Legend

| Emoji | Status |
|-------|--------|
| ⬜ | Not started |
| 🔄 | In progress |
| ✅ | Completed |

## Current Status
- **Current Phase**: Not started
- **Progress**: 0/9
