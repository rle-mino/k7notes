# Plan: Item #1 - Default notes structure on account creation

## Context

The application uses better-auth (v1.2.12) for authentication with a direct proxy pattern in `AuthController`. Better-auth supports `databaseHooks.user.create.after` callbacks in `auth.config.ts`, which is the cleanest integration point for triggering folder creation after user signup.

The folders system already supports:
- Hierarchical folder structures via `parentId` self-reference
- User ownership via `userId` foreign key with cascade delete
- Full CRUD operations in `FoldersService`

Key files:
- `packages/api/src/auth/auth.config.ts` - Better-auth configuration with hooks
- `packages/api/src/folders/folders.service.ts` - Folder creation logic
- `packages/api/src/db/schema.ts` - Database schema

## Clarifications

| Question | Answer |
|----------|--------|
| Approach for triggering folder creation | Better-auth `databaseHooks.user.create.after` |
| Folder structure | Daily, People, Projects, Archive (4 root folders) |
| Folder types/metadata | Standard folders with names only (no special type field) |
| Daily subfolder structure | Root "Daily" folder only on signup; year/month subfolders created later when daily notes are added (separate feature) |
| Completion conditions | Create dedicated E2E test; pre-commit hooks must pass |

## Completion Conditions

| Condition | Validation Command | Expected Outcome |
|-----------|-------------------|------------------|
| E2E test passes | `pnpm turbo test --filter=@k7notes/e2e` | New signup test verifies default folders exist |
| Pre-commit hooks pass | `pnpm lint && pnpm type-check` | No errors |
| API type-check passes | `pnpm turbo type-check --filter=@k7notes/api` | No TypeScript errors |

## Execution Steps

| Step | Phases | Description |
|------|--------|-------------|
| 1    | 1      | Add FoldersService method for creating default folders |
| 2    | 2      | Integrate with better-auth hooks (depends on service method) |
| 3    | 3      | Add E2E test (depends on hook integration) |

> **Parallelism**: Each phase depends on the previous, so sequential execution is required.

## Phases

### ✅ Phase 1: Add default folder creation method to FoldersService

- **Step**: 1
- **Complexity**: 2
- [x] Add `createDefaultFolders(userId: string): Promise<Folder[]>` method to `FoldersService`
- [x] Create 4 root folders: "Daily", "People", "Projects", "Archive"
- [x] Return array of created folders for verification
- **Files**: `packages/api/src/folders/folders.service.ts`
- **Commit message**: `feat(api): add createDefaultFolders method to FoldersService`
- **Bisect note**: N/A - new method not called yet, no callers to break
- **Implementation notes**: Added `createDefaultFolders` method at the end of `FoldersService` (line 202). Uses a single batch `db.insert().values([...]).returning()` call to create all 4 root folders at once, which is more efficient than 4 separate inserts. Each folder is created with `parentId: null` (root-level). No deviations from the plan.
- **Validation results**: `pnpm turbo type-check --filter=@k7notes/api` passed (no TypeScript errors). `pnpm lint` passed (no lint errors across all workspaces). `pnpm type-check` passed (all packages type-check clean).
- **Review**: Approved - Clean, focused implementation. Single batch insert is efficient. Follows existing service patterns (same insert/returning style as `create` method). All 4 required folders created as root-level. No idempotency guard needed since Phase 2 caller will only invoke once during signup. All completion conditions verified passing.

### ⬜ Phase 2: Integrate with better-auth databaseHooks

- **Step**: 2
- **Complexity**: 3
- [ ] Import `FoldersService` or use direct database insert in auth config
- [ ] Add `databaseHooks.user.create.after` callback in `auth.config.ts`
- [ ] Call default folder creation in the after hook
- [ ] Handle errors gracefully (log but don't fail signup)
- **Files**: `packages/api/src/auth/auth.config.ts`, possibly `packages/api/src/auth/auth.module.ts`
- **Commit message**: `feat(api): create default folders on user signup via better-auth hook`
- **Bisect note**: Must call the service method from Phase 1; both must be complete for feature to work

### ⬜ Phase 3: Add E2E test for default folder creation on signup

- **Step**: 3
- **Complexity**: 2
- [ ] Create new test file `packages/e2e/tests/folders/default-folders.spec.ts`
- [ ] Test that after signup, user has exactly 4 folders: Daily, People, Projects, Archive
- [ ] Verify folders are root-level (no parentId)
- [ ] Verify folders belong to the newly created user
- **Files**: `packages/e2e/tests/folders/default-folders.spec.ts`
- **Commit message**: `test(e2e): add test for default folder creation on signup`
- **Bisect note**: N/A - test file addition, doesn't break existing functionality

## Phase Status Legend

| Emoji | Status |
|-------|--------|
| ⬜ | Not started |
| 🔄 | In progress |
| ✅ | Completed |

## Current Status
- **Current Phase**: Phase 2
- **Progress**: 1/3
