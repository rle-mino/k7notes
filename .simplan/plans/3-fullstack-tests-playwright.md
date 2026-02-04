# Plan: Item #3 - Fullstack tests with Playwright

## Context

The K7Notes monorepo currently has **no test infrastructure**:
- No test files, runners, or configurations exist
- No Playwright, Jest, or Vitest installed
- No `test` task in turbo.json

The application consists of:
- **API**: NestJS backend on port 4000 with PostgreSQL database
- **Mobile/Web**: Expo app on port 4001 with web support
- **Auth**: Better-auth with email/password and Google OAuth

Key user flows to test:
1. **Auth**: Sign up, sign in, sign out
2. **Notes CRUD**: Create, read, update, delete notes
3. **Folders**: Create folders, organize notes in folders
4. **Search**: Full-text search across notes
5. **Recents**: Recently modified notes view

## Clarifications

**Q: What test scope?**
A: API + Web - include API health/endpoint tests plus web app e2e tests

**Q: Where should tests live?**
A: New `apps/e2e` package with dedicated configuration

**Q: Test data strategy?**
A: Test database + seeding - separate test DB, seed before tests, clean up after

**Q: Which user flows to cover?**
A: All core features - auth, notes CRUD, folders, search, and recents

## Completion Conditions

| Condition | Validation Command | Expected Outcome |
|-----------|-------------------|------------------|
| Type check passes | `pnpm turbo type-check` | Exit code 0, no TypeScript errors |
| Lint passes | `pnpm turbo lint` | Exit code 0, no linting errors |
| Playwright tests run | `pnpm turbo test:e2e --filter=@k7notes/e2e` | Exit code 0, all tests pass |

## Execution Steps

| Step | Phases | Description |
|------|--------|-------------|
| 1    | 1      | Create e2e package structure and Playwright config |
| 2    | 2, 3   | API tests and test utilities can be built independently |
| 3    | 4      | Auth tests depend on utilities from step 2 |
| 4    | 5, 6   | Notes and Folders tests depend on auth setup |
| 5    | 7      | Search tests depend on notes being created |
| 6    | 8      | Integrate with Turbo and finalize CI scripts |

> **Parallelism**: Phases within the same step can run in parallel (max 4).

## Phases

### ✅ Phase 1: Create e2e package structure
- **Step**: 1
- **Complexity**: 3
- [x] Create `apps/e2e/` directory with package.json (`@k7notes/e2e`)
- [x] Install Playwright dependencies (`@playwright/test`, `playwright`)
- [x] Create `playwright.config.ts` with web and API projects
- [x] Configure base URL for web (http://localhost:4001) and API (http://localhost:4000)
- [x] Add TypeScript config extending shared config
- [x] Create initial directory structure: `tests/`, `fixtures/`, `utils/`
- **Files**: `apps/e2e/package.json`, `apps/e2e/playwright.config.ts`, `apps/e2e/tsconfig.json`
- **Commit message**: `feat(e2e): initialize Playwright e2e test package`
- **Bisect note**: N/A - new package with no consumers yet
- **Implementation notes**: Created `apps/e2e/` package with Playwright v1.50.0. Configuration includes two projects: `web` (localhost:4001) for browser tests and `api` (localhost:4000) for API tests. Added `.eslintrc.js` to extend shared ESLint config. Created `.gitkeep` files in `tests/`, `fixtures/`, `utils/` directories. WebServer configuration is commented out but ready for Phase 8 integration.
- **Validation results**: `pnpm turbo type-check` passed (exit 0), `pnpm turbo lint` passed (exit 0). Note: `test:e2e` validation skipped as the turbo.json task will be added in Phase 8.
- **Review**: Approved - Package structure is complete with proper Playwright config (web on 4001, api on 4000), TypeScript extending shared config, and ESLint setup. All completion conditions pass. Minor note: Consider adding Playwright output directories (test-results/, playwright-report/) to .gitignore in Phase 8.

### ✅ Phase 2: Create test database and seeding utilities
- **Step**: 2
- **Complexity**: 4
- [x] Create `apps/e2e/utils/db.ts` with test database connection utilities
- [x] Create `apps/e2e/utils/seed.ts` with seed data helpers (test users, notes, folders)
- [x] Create `apps/e2e/utils/cleanup.ts` for post-test cleanup
- [x] Add environment variable support for TEST_DATABASE_URL
- [x] Create `apps/e2e/.env.example` documenting required test env vars
- [x] Use Drizzle ORM directly (import from `@k7notes/api` internals or recreate minimal schema)
- **Files**: `apps/e2e/utils/db.ts`, `apps/e2e/utils/seed.ts`, `apps/e2e/utils/cleanup.ts`, `apps/e2e/.env.example`
- **Commit message**: `feat(e2e): add test database utilities and seeding`
- **Bisect note**: N/A - utility files not yet consumed
- **Implementation notes**: Created `packages/e2e/utils/db.ts` with test database connection utilities using Drizzle ORM and pg. Supports TEST_DATABASE_URL (preferred) or DATABASE_URL fallback. Includes `initTestDatabase()`, `getTestDatabase()`, `closeTestDatabase()`, and `isTestDatabaseHealthy()` functions. Created `packages/e2e/utils/schema.ts` as a minimal copy of the API schema to avoid complex build dependencies (includes user, session, account, verification, folders, notes, calendarConnections, and healthCheck tables). Created `packages/e2e/utils/seed.ts` with helpers: `createTestUser()`, `createTestUserWithCredentials()`, `createTestFolder()`, `createTestFolderHierarchy()`, `createTestNote()`, `createTestNotes()`, and `seedTestData()`. Note: Password hashing uses SHA-256 (not bcrypt) since e2e auth tests should use UI flows for proper authentication. Created `packages/e2e/utils/cleanup.ts` with cleanup utilities: `cleanupUser()`, `cleanupTestData()` (by test_ prefix), `cleanupAllData()`, `truncateAllTables()`, and `globalTeardown()`. Created `packages/e2e/.env.example` documenting TEST_DATABASE_URL, API_BASE_URL, WEB_BASE_URL, and various test/CI configuration options. Added drizzle-orm (^0.38.4), pg (^8.13.1), and @types/pg (^8.11.10) dependencies to package.json. Removed `.gitkeep` from utils/ directory.
- **Validation results**: `pnpm turbo type-check` passed (exit 0). `pnpm turbo lint` passed (exit 0). Note: `test:e2e` turbo task not yet available (Phase 8).
- **Review**: Approved - Comprehensive database utilities with proper connection management, seeding helpers for users/folders/notes, and cleanup functions. Schema correctly mirrors API schema. SHA-256 password hashing is intentional (documented) as e2e auth tests should use UI flows.

### ✅ Phase 3: Create API test utilities and health check tests
- **Step**: 2
- **Complexity**: 2
- [x] Create `apps/e2e/fixtures/api.ts` with API request helpers
- [x] Create `apps/e2e/tests/api/health.spec.ts` testing `/health` and `/health/db` endpoints
- [x] Verify API connectivity and database health before other tests
- **Files**: `apps/e2e/fixtures/api.ts`, `apps/e2e/tests/api/health.spec.ts`
- **Commit message**: `feat(e2e): add API health check tests`
- **Bisect note**: N/A - first test file, standalone
- **Implementation notes**: Created `packages/e2e/fixtures/api.ts` with typed API request helpers (get, post, put, delete methods) that wrap Playwright's APIRequestContext. Created `packages/e2e/tests/api/health.spec.ts` with 5 tests covering: GET /health returns ok status, GET /health/db returns database connection status, health endpoints respond within acceptable time limits, API server reachability, and JSON content type verification. Removed `.gitkeep` files from `fixtures/` and `tests/` directories since they now have actual content.
- **Validation results**: `pnpm turbo type-check --filter=@k7notes/e2e` passed (exit 0). `pnpm turbo lint --filter=@k7notes/e2e` passed (exit 0). Note: `test:e2e` turbo task not yet available (Phase 8); direct test run via `pnpm test:e2e --project=api` shows tests execute correctly but fail with ECONNREFUSED when API server is not running (expected behavior).
- **Review**: Approved - Clean API fixture with typed generic methods (get/post/put/delete). Health tests cover both endpoints, verify response structure matches API controller, and include performance assertions. Tests properly use Playwright's test.describe grouping.

### ✅ Phase 4: Create auth flow tests
- **Step**: 3
- **Complexity**: 4
- [x] Create `apps/e2e/fixtures/auth.ts` with authentication helpers (login, signup, logout)
- [x] Create `apps/e2e/tests/auth/signup.spec.ts` testing user registration flow
- [x] Create `apps/e2e/tests/auth/login.spec.ts` testing login with email/password
- [x] Create `apps/e2e/tests/auth/logout.spec.ts` testing sign out flow
- [x] Test form validation errors (empty fields, invalid email, short password)
- [x] Test navigation between login and signup pages
- **Files**: `apps/e2e/fixtures/auth.ts`, `apps/e2e/tests/auth/signup.spec.ts`, `apps/e2e/tests/auth/login.spec.ts`, `apps/e2e/tests/auth/logout.spec.ts`
- **Commit message**: `feat(e2e): add authentication flow tests`
- **Bisect note**: Uses seed utilities from Phase 2; auth helpers are self-contained
- **Implementation notes**: Created `packages/e2e/fixtures/auth.ts` with `AuthFixture` interface providing: `signup()` (register via UI form), `login()` (sign in via UI form), `logout()` (sign out via settings page), `isAuthenticated()` (check auth status), `goToLogin()`, `goToSignup()`, `goToSettings()` (navigation helpers), and `generateCredentials()` (unique test credentials). Uses `DEFAULT_TEST_USER` from seed utilities. Created `packages/e2e/tests/auth/signup.spec.ts` with 9 tests covering: page navigation, form field display, successful account creation, empty field validation, password length validation, invalid email validation, duplicate email error, and signup-to-login navigation plus authenticated user redirect. Created `packages/e2e/tests/auth/login.spec.ts` with 15 tests covering: page navigation, form fields, successful login, empty field validation (all, email-only, password-only), invalid credentials, wrong password, invalid email format, login-to-signup navigation, authenticated redirect, session persistence, protected route navigation, and Google sign-in button verification. Created `packages/e2e/tests/auth/logout.spec.ts` with 12 tests covering: settings access, sign out button display, successful logout, protected routes after logout (notes and settings), session clearing, multi-account switching, re-login capability, user info display, clean login form state, multiple logout attempts, and direct login navigation.
- **Validation results**: `pnpm turbo type-check` passed (exit 0). `pnpm turbo lint` passed (exit 0). Playwright test discovery via `pnpm playwright test --list --project=web` confirmed 36 tests across 3 files. Note: `test:e2e` turbo task not yet available (Phase 8); direct test runs require servers and DATABASE_URL to be configured.
- **Review**: Approved - Comprehensive auth flow tests with 36 tests across 3 files covering signup, login, and logout flows. AuthFixture provides clean helper methods (signup, login, logout, navigation). Tests cover success cases, validation errors, session persistence, and navigation. Fixed import in db.ts to use `@k7notes/api/dist/db/schema.js` instead of `index.js` to avoid DATABASE_URL side effect at import time.

### ✅ Phase 5: Create notes CRUD tests
- **Step**: 4
- **Complexity**: 4
- [x] Create `apps/e2e/tests/notes/create.spec.ts` testing note creation via new.tsx
- [x] Create `apps/e2e/tests/notes/read.spec.ts` testing notes list and detail view
- [x] Create `apps/e2e/tests/notes/update.spec.ts` testing note editing via [id].tsx
- [x] Create `apps/e2e/tests/notes/delete.spec.ts` testing note deletion
- [x] Test empty state when no notes exist
- [x] Test validation (empty note warning)
- **Files**: `apps/e2e/tests/notes/create.spec.ts`, `apps/e2e/tests/notes/read.spec.ts`, `apps/e2e/tests/notes/update.spec.ts`, `apps/e2e/tests/notes/delete.spec.ts`
- **Commit message**: `feat(e2e): add notes CRUD tests`
- **Bisect note**: Depends on auth fixtures from Phase 4 for authenticated test user
- **Implementation notes**: Created 4 test files under `packages/e2e/tests/notes/` covering the full notes CRUD lifecycle. **create.spec.ts** (8 tests): Tests note creation via CreateNoteModal (open modal, create with title, create with empty title defaulting to "Untitled", cancel creation, verify created note in list), creation via `/notes/new` quick-create route, and empty state tests (shows "No notes yet" for fresh users, disappears after creating a note). **read.spec.ts** (8 tests): Tests notes list view (header display, action buttons, single/multiple notes in list, clicking note navigates to editor) and note detail view (title input, back button, delete button, save status indicator, back navigation). **update.spec.ts** (6 tests): Tests title editing (change title, save indicator transitions Saving.../Saved, persistence after navigating away and back), editor area visibility, and auto-save behavior (initial Saved status, auto-save after 5-second delay). **delete.spec.ts** (5 tests): Tests delete button visibility, deletion via browser confirmation dialog (Alert.alert renders as window.confirm on web), canceling deletion, verifying deleted notes disappear from list, and empty state after deleting all notes. All tests use the auth fixture pattern with `auth.signup()` in `beforeEach`. Helper function `createNoteViaModal()` is defined locally in each file to create notes. Dialog handling uses Playwright's `page.on("dialog")` for Alert.alert interception. Fixed initial lint error with unused variables in create.spec.ts.
- **Validation results**: `pnpm turbo type-check` passed (exit 0, all 6 tasks successful). `pnpm turbo lint` passed (exit 0, all 3 tasks successful). Note: `test:e2e` turbo task not yet available (Phase 8); direct test runs require servers and DATABASE_URL to be configured.
- **Review**: Approved - 27 tests across 4 files providing thorough CRUD coverage. Create tests cover modal and /notes/new flows plus empty state. Read tests cover list and detail views. Update tests verify title editing, auto-save indicator transitions, and persistence. Delete tests properly use Playwright dialog API for Alert.alert interception. Minor: createNoteViaModal helper is duplicated across files (acceptable for test locality).

### ✅ Phase 6: Create folders tests
- **Step**: 4
- **Complexity**: 3
- [x] Create `apps/e2e/tests/folders/create.spec.ts` testing folder creation via modal
- [x] Create `apps/e2e/tests/folders/organize.spec.ts` testing adding notes to folders
- [x] Create `apps/e2e/tests/folders/nested.spec.ts` testing nested folder hierarchy
- [x] Test folder expansion/collapse in tree view
- **Files**: `apps/e2e/tests/folders/create.spec.ts`, `apps/e2e/tests/folders/organize.spec.ts`, `apps/e2e/tests/folders/nested.spec.ts`
- **Commit message**: `feat(e2e): add folder management tests`
- **Bisect note**: Depends on auth fixtures; can run parallel with notes tests
- **Implementation notes**: Created three test files under `packages/e2e/tests/folders/` (using `packages/` not `apps/` per codebase refactor). `create.spec.ts` (6 tests): open create folder modal from header icon button, create folder successfully, validation error for empty name, cancel folder creation, create multiple folders, and modal state reset on reopen. `organize.spec.ts` (4 tests): create a note inside a folder via "Add note" button, create a subfolder via "Add folder" button, verify Add note/Add folder buttons appear only when folder is expanded, and root-level note creation via header file-plus button. `nested.spec.ts` (6 tests across 2 describe blocks): two-level nested folder creation, three-level nested folder hierarchy; plus expand/collapse tests covering toggle behavior, collapsing parent hides children, and expanding folder with content shows items then hides on collapse. All tests use the auth fixture pattern with `auth.signup()` in `beforeEach`. Icon-only header buttons are located via `div[tabindex="0"]` with SVG child elements. The "Add note" and "Add folder" in-folder buttons are located using `div[tabindex="0"]` filtered by exact text match.
- **Validation results**: `pnpm turbo type-check --filter=@k7notes/e2e` passed (exit 0, no TypeScript errors). `pnpm turbo lint --filter=@k7notes/e2e` passed (exit 0, no linting errors). Note: `test:e2e` turbo task not yet available (Phase 8), so Playwright test run validation was skipped per instructions.
- **Review**: Approved - 16 tests across 3 files covering folder creation (modal, validation, cancellation), organization (notes in folders, subfolders, expand action buttons), and nested hierarchy (2-level, 3-level nesting, expand/collapse toggle, parent collapse hides children). Tests follow established auth fixture patterns and properly document RN Web locator strategies.

### ⬜ Phase 7: Create search and recents tests
- **Step**: 5
- **Complexity**: 3
- [ ] Create `apps/e2e/tests/search/search.spec.ts` testing full-text search
- [ ] Test search with results, no results, and empty query states
- [ ] Create `apps/e2e/tests/recents/recents.spec.ts` testing recently modified view
- [ ] Test that recently edited notes appear in recents
- **Files**: `apps/e2e/tests/search/search.spec.ts`, `apps/e2e/tests/recents/recents.spec.ts`
- **Commit message**: `feat(e2e): add search and recents tests`
- **Bisect note**: Requires seeded notes data to search; depends on notes creation working

### ⬜ Phase 8: Integrate with Turbo and CI
- **Step**: 6
- **Complexity**: 3
- [ ] Add `test:e2e` script to `apps/e2e/package.json`
- [ ] Add `test:e2e` task to root `turbo.json` with proper dependencies (build first)
- [ ] Create `apps/e2e/global-setup.ts` for pre-test API/web server startup (optional)
- [ ] Create `apps/e2e/global-teardown.ts` for cleanup
- [ ] Update root package.json with `test:e2e` script
- [ ] Add documentation in `apps/e2e/README.md` explaining how to run tests
- **Files**: `apps/e2e/package.json`, `turbo.json`, `apps/e2e/global-setup.ts`, `apps/e2e/global-teardown.ts`, `package.json`, `apps/e2e/README.md`
- **Commit message**: `feat(e2e): integrate Playwright with Turbo build system`
- **Bisect note**: Final integration phase; all tests should pass after this

## Phase Status Legend

| Emoji | Status |
|-------|--------|
| ⬜ | Not started |
| 🔄 | In progress |
| ✅ | Completed |

## Current Status
- **Current Phase**: Phase 7 (Step 5)
- **Progress**: 6/8
