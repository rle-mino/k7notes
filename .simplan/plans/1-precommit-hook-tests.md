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

### ⬜ Phase 1: Install dependencies
- **Step**: 1
- **Complexity**: 1
- [ ] Install husky as root devDependency
- [ ] Install lint-staged as root devDependency
- **Files**: `package.json`
- **Commit message**: `chore: add husky and lint-staged dependencies`
- **Bisect note**: N/A - just adds dependencies

### ⬜ Phase 2: Create docker-compose for dev services
- **Step**: 2
- **Complexity**: 2
- [ ] Create `docker-compose.yml` with PostgreSQL service
- [ ] Use same connection string as `.env.example` (postgres:postgres@localhost:5432/k7notes)
- [ ] Add volume for data persistence
- [ ] Add healthcheck for postgres readiness
- **Files**: `docker-compose.yml`
- **Commit message**: `chore: add docker-compose for local PostgreSQL`
- **Bisect note**: Standalone file, no dependencies

### ⬜ Phase 3: Configure lint-staged
- **Step**: 3
- **Complexity**: 2
- [ ] Add lint-staged config to root `package.json`
- [ ] Configure to run `eslint --fix` on staged `.ts` and `.tsx` files
- [ ] Configure to run TypeScript type-check on staged files (using tsc-files or project-wide)
- [ ] Scope lint to appropriate workspaces based on file path
- **Files**: `package.json`
- **Commit message**: `chore: configure lint-staged for monorepo`
- **Bisect note**: Config only, no hook installed yet

### ⬜ Phase 4: Enable Playwright webServer auto-start
- **Step**: 4
- **Complexity**: 2
- [ ] Uncomment and configure `webServer` in `playwright.config.ts`
- [ ] Add API server config with health check URL
- [ ] Add mobile web server config
- [ ] Set `reuseExistingServer: true` for local dev (faster if already running)
- **Files**: `apps/e2e/playwright.config.ts`
- **Commit message**: `feat(e2e): enable automatic server startup for tests`
- **Bisect note**: Config change only, tests still run

### ⬜ Phase 5: Create pre-commit hook script
- **Step**: 5
- **Complexity**: 3
- [ ] Create `.husky/pre-commit` script
- [ ] Start Docker containers (postgres) with `docker compose up -d`
- [ ] Wait for postgres to be healthy
- [ ] Run lint-staged for staged file checks
- [ ] Run full E2E tests via `pnpm --filter @k7notes/e2e test:e2e`
- [ ] Add cleanup on failure (stop containers on error)
- [ ] Make script executable
- **Files**: `.husky/pre-commit`
- **Commit message**: `feat: add pre-commit hook with lint, type-check, and e2e tests`
- **Bisect note**: Hook not active until husky is initialized in phase 6

### ⬜ Phase 6: Initialize husky and add prepare script
- **Step**: 6
- **Complexity**: 1
- [ ] Add `"prepare": "husky"` script to root `package.json`
- [ ] Run `pnpm prepare` to initialize husky
- [ ] Verify hook is installed in `.husky/`
- **Files**: `package.json`
- **Commit message**: `chore: initialize husky for git hooks`
- **Bisect note**: Activates the hook from phase 5

## Phase Status Legend

| Emoji | Status |
|-------|--------|
| ⬜ | Not started |
| 🔄 | In progress |
| ✅ | Completed |

## Current Status
- **Current Phase**: Not started
- **Progress**: 0/6
