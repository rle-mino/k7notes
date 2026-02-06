# K7Notes Memory

## Pre-commit Hooks
- The repo has pre-commit hooks that run lint-staged, type-check, AND full E2E tests
- E2E tests use Playwright and spin up a PostgreSQL Docker container
- Commits can take ~1-2 minutes due to E2E test suite (103 tests)
- When changing backend behavior (e.g., creating default folders on signup), existing E2E tests that assume empty state for new users will break - fix them in the same commit

## Architecture Notes
- `auth.config.ts` is a standalone module-level file, NOT inside NestJS DI context
- `FoldersService` has no constructor dependencies (uses `db` import directly), so it can be instantiated with `new FoldersService()` outside DI
- better-auth supports `databaseHooks.user.create.after` for post-signup actions

## simplan Config
- `commit_plan=true` - plan files should be staged alongside code commits
