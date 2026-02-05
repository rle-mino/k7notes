# Plan: Item #4 - Pre-commit hook to protect against regression

## Context

- **Monorepo**: pnpm workspaces + Turborepo with `apps/api`, `apps/mobile`, `apps/e2e`, `apps/landing`, and `packages/*`
- **Existing scripts**: Root has `lint`, `type-check`, `build`, `dev` via turbo
- **E2E setup**: Playwright in `apps/e2e` with web and api projects, configured for ports 4001 (mobile) and 4000 (api)
- **No existing hooks**: Only sample hooks in `.git/hooks/`, no husky or lint-staged installed
- **No docker-compose yet**: User will set up Docker containers before executing this plan

## Clarifications

1. **Checks to run**: All checks - Lint + Type-check + E2E tests
2. **Tool**: Husky + lint-staged
3. **Scope**: Staged files only for lint/type-check; full E2E suite runs after
4. **E2E handling**: Auto-start services (API + mobile web) before tests, stop after
5. **Database**: User will provide Docker setup; hook will start containers

## Completion Conditions

| Condition | Validation Command | Expected Outcome |
|-----------|-------------------|------------------|
| Husky installed | `test -f .husky/pre-commit` | File exists |
| Hook executable | `test -x .husky/pre-commit` | Exit code 0 |
| lint-staged works | `echo "test" > /tmp/test.ts && pnpm lint-staged --diff="HEAD" --diff-filter=A 2>&1 \|\| true` | No installation errors |
| Type-check passes | `pnpm type-check` | Exit code 0 |
| Lint passes | `pnpm lint` | Exit code 0 |

## Execution Steps

| Step | Phases | Description |
|------|--------|-------------|
| 1    | 1      | Install husky and lint-staged dependencies |
| 2    | 2      | Create docker-compose for development services |
| 3    | 3      | Configure lint-staged for the monorepo |
| 4    | 4      | Enable Playwright webServer auto-start |
| 5    | 5      | Create the pre-commit hook script |
| 6    | 6      | Add prepare script and initialize husky |

> **Parallelism**: Each phase depends on the previous one or modifies related configuration.

## Phases

### ✅ Phase 1: Install dependencies
- **Step**: 1
- **Complexity**: 1
- [x] Install husky as root devDependency
- [x] Install lint-staged as root devDependency
- **Files**: `package.json`
- **Commit message**: `chore: add husky and lint-staged dependencies`
- **Bisect note**: N/A - just adds dependencies
- **Implementation notes**: Installed husky ^9.1.7 and lint-staged ^16.2.7 via `pnpm add -D -w husky lint-staged`. Both packages added to root devDependencies in package.json.
- **Validation results**: lint-staged runs successfully (shows "could not find any staged files" which is expected); type-check passes; lint passes.
- **Review**: Approved - Dependencies correctly added to root devDependencies with appropriate version specs. All completion conditions verified: lint-staged runs without installation errors, type-check passes, lint passes.

### ✅ Phase 2: Create docker-compose for dev services
- **Step**: 2
- **Complexity**: 2
- [x] Create `docker-compose.yml` with PostgreSQL service
- [x] Use same connection string as `.env.example` (postgres:postgres@localhost:5432/k7notes)
- [x] Add volume for data persistence
- [x] Add healthcheck for postgres readiness
- **Files**: `packages/stack-k7/docker-compose.yml`
- **Commit message**: `chore: add docker-compose for local PostgreSQL`
- **Bisect note**: Standalone file, no dependencies
- **Implementation notes**: Already exists at `packages/stack-k7/docker-compose.yml` with PostgreSQL 17-alpine, healthcheck using `pg_isready`, and persistent volume. Port mapped to 4432:5432.
- **Review**: Pre-existing - Docker infrastructure was already set up in the stack-k7 package with all required features.

### ✅ Phase 3: Configure lint-staged
- **Step**: 3
- **Complexity**: 2
- [x] Add lint-staged config to root `package.json`
- [x] Configure to run `eslint --fix` on staged `.ts` and `.tsx` files
- [x] Configure to run TypeScript type-check on staged files (using tsc-files or project-wide)
- [x] Scope lint to appropriate workspaces based on file path
- **Files**: `package.json`
- **Commit message**: `chore: configure lint-staged for monorepo`
- **Bisect note**: Config only, no hook installed yet
- **Implementation notes**: Added `lint-staged` configuration to root `package.json` with workspace-scoped patterns: `packages/api/**/*.ts`, `packages/mobile/**/*.{ts,tsx}`, and `packages/e2e/**/*.ts` run `eslint --fix`; `packages/**/*.{ts,tsx}` triggers project-wide `pnpm type-check` via turbo (type-checking individual files is not reliable in TypeScript monorepos due to cross-package dependencies).
- **Validation results**: lint-staged runs without installation errors (shows "could not find any staged files" when no files staged); type-check passes; lint passes. Tested with staged file - lint-staged correctly runs eslint and type-check.
- **Review**: Approved - lint-staged config correctly scopes to workspaces with eslint scripts (api, mobile, e2e). Uses project-wide type-check via turbo which is appropriate for monorepo with cross-package dependencies. All applicable completion conditions pass.

### ✅ Phase 4: Enable Playwright webServer auto-start
- **Step**: 4
- **Complexity**: 2
- [x] Uncomment and configure `webServer` in `playwright.config.ts`
- [x] Add API server config with health check URL
- [x] Add mobile web server config
- [x] Set `reuseExistingServer: false` (ensures test database is used)
- **Files**: `packages/e2e/playwright.config.ts`
- **Commit message**: `feat(e2e): enable automatic server startup for tests`
- **Bisect note**: Config change only, tests still run
- **Implementation notes**: Already configured in `packages/e2e/playwright.config.ts`. The `webServer` array includes: (1) API server via `pnpm turbo dev --filter=@k7notes/api` with health check at `/health` on port 4000, using `TEST_DATABASE_URL` env var; (2) Mobile web server via `pnpm turbo start --filter=@k7notes/mobile -- --web` on port 4001. Both have 2-minute timeouts and `reuseExistingServer: false` to ensure clean test environment.
- **Review**: Pre-existing - Playwright webServer configuration was already fully implemented with both servers, health checks, test database isolation, and appropriate timeouts.

### ✅ Phase 5: Create pre-commit hook script
- **Step**: 5
- **Complexity**: 3
- [x] Create `.husky/pre-commit` script
- [x] Start Docker containers (postgres) with `docker compose up -d`
- [x] Wait for postgres to be healthy
- [x] Run lint-staged for staged file checks
- [x] Run full E2E tests via `pnpm --filter @k7notes/e2e test:e2e`
- [x] Add cleanup on failure (stop containers on error)
- [x] Make script executable
- **Files**: `.husky/pre-commit`
- **Commit message**: `feat: add pre-commit hook with lint, type-check, and e2e tests`
- **Bisect note**: Hook not active until husky is initialized in phase 6
- **Implementation notes**: Pre-commit hook already exists at `.husky/pre-commit` with all required functionality: (1) Starts PostgreSQL via `docker compose -f packages/stack-k7/docker-compose.yml up -d`; (2) Waits for postgres health using `pg_isready` with 30-retry loop; (3) Runs `pnpm lint-staged` for staged file linting and type-checking; (4) Runs `pnpm --filter @k7notes/e2e test:e2e` for E2E tests; (5) Has cleanup trap that stops containers on exit (success or failure). Script is already executable (755 permissions).
- **Validation results**: All completion conditions pass: (1) File exists at `.husky/pre-commit`; (2) File is executable; (3) lint-staged runs without installation errors; (4) `pnpm type-check` passes; (5) `pnpm lint` passes.
- **Review**: Approved - Pre-commit hook is complete and well-implemented: starts postgres via docker-compose with health check retry loop, runs lint-staged for staged files, runs E2E tests via turbo, and has proper cleanup trap that stops containers on exit (both success and failure). All completion conditions verified and passing.

### ⬜ Phase 6: Initialize husky and add prepare script
- **Step**: 6
- **Complexity**: 1
- [x] Add `"prepare": "husky"` script to root `package.json`
- [x] Run `pnpm prepare` to initialize husky
- [x] Verify hook is installed in `.husky/`
- **Files**: `package.json`
- **Commit message**: `chore: initialize husky for git hooks`
- **Bisect note**: Activates the hook from phase 5
- **Implementation notes**: Added `"prepare": "husky"` script to root `package.json`. Running `pnpm prepare` initialized husky, creating the `.husky/_` directory and setting `core.hooksPath` to `.husky/_`. The pre-commit hook from Phase 5 is now active and will be executed on each commit.
- **Validation results**: All completion conditions pass: (1) `.husky/pre-commit` file exists; (2) pre-commit is executable; (3) lint-staged runs without installation errors; (4) `pnpm type-check` passes; (5) `pnpm lint` passes.
- **Review**: Approved - The "prepare" script was added correctly to root package.json. Husky is properly initialized with git core.hooksPath set to .husky/_ and the pre-commit hook is now active. All completion conditions verified and passing.

## Phase Status Legend

| Emoji | Status |
|-------|--------|
| ⬜ | Not started |
| 🔄 | In progress |
| ✅ | Completed |

## Current Status
- **Current Phase**: Phase 6 - Initialize husky and add prepare script
- **Progress**: 5/6
