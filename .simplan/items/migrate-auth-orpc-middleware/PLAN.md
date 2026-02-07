# Plan: Migrate auth from NestJS guards to oRPC middleware

## Context

Currently, authentication in the API uses a NestJS `AuthGuard` that:
1. Extracts Express headers, converts them to web `Headers`
2. Calls `auth.api.getSession({ headers })`
3. Attaches `user` and `session` to the Express request object

Every controller handler then does `context.request as unknown as AuthenticatedRequest` to access the user — an unsafe double cast repeated ~22 times across 4 controllers.

The oRPC `implement()` function supports `.use()` middleware chaining, which can inject typed context. The `ORPCGlobalContext` interface in `@orpc/nest` can be extended to include `headers` (and later `user`/`session`), making the auth context type-safe throughout all handlers.

**Files affected:**
- `packages/api/src/app.module.ts` — ORPCGlobalContext + header conversion in factory
- `packages/api/src/auth/auth.middleware.ts` — **new** oRPC auth middleware
- `packages/api/src/auth/auth.guard.ts` — **delete**
- `packages/api/src/notes/notes.controller.ts` — remove guard, use middleware
- `packages/api/src/folders/folders.controller.ts` — remove guard, use middleware
- `packages/api/src/calendar/calendar.controller.ts` — remove guard, use middleware
- `packages/api/src/transcriptions/transcriptions.controller.ts` — remove guard, use middleware

## Clarifications

1. **Header conversion**: Done in `ORPCModule.forRootAsync` factory — convert Express headers to web `Headers` and pass both `request` and `headers` in global context.
2. **Calendar OAuth route**: Keep the `@Get("api/calendar/oauth/callback")` as a traditional NestJS route (no auth needed).
3. **Cleanup**: Fully delete `AuthGuard` and `AuthenticatedRequest` — no non-oRPC protected routes remain.
4. **Completion conditions**: Type-check + lint + build + tests.

## Completion Conditions

| Condition | Validation Command | Expected Outcome |
|-----------|-------------------|------------------|
| Type check | `pnpm type-check` | Exit code 0, no errors |
| Lint | `pnpm lint` | Exit code 0, no errors |
| Build | `pnpm build` | Exit code 0, builds successfully |
| Unit tests | `pnpm turbo test --filter=@k7notes/api` | Exit code 0, all tests pass |

## Execution Steps

| Step | Phases | Description |
|------|--------|-------------|
| 1    | 1, 2   | Create auth middleware and update global context (independent files) |
| 2    | 3, 4, 5, 6 | Migrate all 4 controllers to use middleware (independent of each other, depend on step 1) |
| 3    | 7      | Delete AuthGuard file and clean up (depends on all controllers migrated) |

> **Parallelism**: Phases within the same step can run in parallel (max 4).

## Phases

### ✅ Phase 1: Extend ORPCGlobalContext with headers
- **Step**: 1
- **Complexity**: 2
- [x] In `app.module.ts`, add `headers: Headers` to the `ORPCGlobalContext` interface declaration
- [x] In the `ORPCModule.forRootAsync` factory, convert Express request headers to a web `Headers` object and include it in the context alongside `request`
- **Files**: `packages/api/src/app.module.ts`
- **Commit message**: `refactor: add headers to oRPC global context`
- **Bisect note**: N/A — additive change, existing code still works with `context.request`
- **Implementation notes**: Added `headers: Headers` to the `ORPCGlobalContext` interface. Converted the `useFactory` arrow function from an expression body to a block body to accommodate the header conversion logic. Iterates over Express `request.headers` entries, converts to a web `Headers` object (joining array values with `", "`), and passes both `request` and `headers` in the context object.
- **Validation results**: Type-check passes (exit 0). Lint fails with pre-existing errors in `mock-calendar.provider.ts` (unused var) and spec files (`no-explicit-any`) -- confirmed identical on main branch before changes, not introduced by this phase.
- **Review**: Approved - Header conversion logic matches existing AuthGuard pattern exactly. ORPCGlobalContext correctly extended. Clean, minimal change.

### ✅ Phase 2: Create oRPC auth middleware
- **Step**: 1
- **Complexity**: 3
- [x] Create `packages/api/src/auth/auth.middleware.ts`
- [x] Export an `authMiddleware` function that uses `implement` from `@orpc/nest` to create a middleware: reads `context.headers`, calls `auth.api.getSession()`, throws `ORPCError('UNAUTHORIZED')` if no session, otherwise calls `next()` with `{ user, session }` in context
- [x] Export a helper `authed(contractProcedure)` function that returns `implement(contractProcedure).use(authMiddleware)` for ergonomic use in controllers
- [x] Export TypeScript types for the user/session shape injected into context
- **Files**: `packages/api/src/auth/auth.middleware.ts`
- **Commit message**: `feat: add oRPC auth middleware for typed user context`
- **Bisect note**: New file, not yet used — safe standalone
- **Implementation notes**: Created the middleware file. The auth middleware is defined as an inline arrow function inside the `authed()` helper rather than a standalone `authMiddleware` variable, because the oRPC `Middleware` type has 6 generic parameters that made standalone typing cumbersome. Inlining it lets TypeScript infer all generics from the `implement(contractProcedure).use()` call site. Used `AnyContractProcedure` (not `AnyContractRouter`) as the generic constraint for `authed()` to avoid a union type error where `.use()` signatures from `ProcedureImplementer` and `RouterImplementer` were incompatible. Exported types: `AuthUser`, `AuthSession`, `AuthContext`.
- **Validation results**: Type-check passes (exit 0). Lint has pre-existing errors in unrelated files (`mock-calendar.provider.ts`, spec files) -- not introduced by this phase.
- **Review**: Approved - Middleware correctly validates session via better-auth, throws ORPCError on failure, injects typed user/session context. Type shapes match existing AuthenticatedRequest interface. Good use of satisfies for type safety.

### ⬜ Phase 3: Migrate NotesController
- **Step**: 2
- **Complexity**: 2
- [ ] Remove `@UseGuards(AuthGuard)` from class decorator
- [ ] Replace `import { AuthGuard, AuthenticatedRequest }` with import of `authed` from auth middleware
- [ ] In each handler, replace `implement(contract.notes.xxx).handler(...)` with `authed(contract.notes.xxx).handler(...)` and use `context.user.id` instead of casting
- [ ] Remove `UseGuards` import from `@nestjs/common` if no longer needed
- **Files**: `packages/api/src/notes/notes.controller.ts`
- **Commit message**: `refactor: migrate notes controller to oRPC auth middleware`
- **Bisect note**: Must update all 6 handlers together to avoid mixing guard + middleware patterns

### ⬜ Phase 4: Migrate FoldersController
- **Step**: 2
- **Complexity**: 2
- [ ] Same pattern as Phase 3: remove guard, import `authed`, use `context.user.id`
- [ ] Update all 7 handler methods
- **Files**: `packages/api/src/folders/folders.controller.ts`
- **Commit message**: `refactor: migrate folders controller to oRPC auth middleware`
- **Bisect note**: Must update all 7 handlers together

### ⬜ Phase 5: Migrate CalendarController
- **Step**: 2
- **Complexity**: 2
- [ ] Remove per-method `@UseGuards(AuthGuard)` from the 6 oRPC handlers
- [ ] Import `authed` from auth middleware, replace `implement()` with `authed()` pattern
- [ ] Keep the `oauthCallback` method as-is (traditional NestJS route, no auth)
- [ ] Keep `@Get`, `@Query`, `@Res`, `@Throttle` imports for the OAuth callback
- [ ] Remove `AuthGuard`, `AuthenticatedRequest` imports
- **Files**: `packages/api/src/calendar/calendar.controller.ts`
- **Commit message**: `refactor: migrate calendar controller to oRPC auth middleware`
- **Bisect note**: Must update all 6 oRPC handlers together; OAuth callback unchanged

### ⬜ Phase 6: Migrate TranscriptionsController
- **Step**: 2
- **Complexity**: 2
- [ ] Remove `@UseGuards(AuthGuard)` from class decorator
- [ ] Import `authed`, update `transcribe` handler to use `context.user.id`
- [ ] Note: `linkToNote` and `listProviders` don't use auth — keep them using plain `implement()`
- **Files**: `packages/api/src/transcriptions/transcriptions.controller.ts`
- **Commit message**: `refactor: migrate transcriptions controller to oRPC auth middleware`
- **Bisect note**: Class-level guard removal means `linkToNote`/`listProviders` become public — verify this is intended (they don't access userId currently)

### ⬜ Phase 7: Delete AuthGuard and clean up
- **Step**: 3
- **Complexity**: 1
- [ ] Delete `packages/api/src/auth/auth.guard.ts`
- [ ] Verify no remaining imports of `AuthGuard` or `AuthenticatedRequest` anywhere
- **Files**: `packages/api/src/auth/auth.guard.ts` (delete)
- **Commit message**: `chore: remove AuthGuard and AuthenticatedRequest`
- **Bisect note**: Only safe after all controllers migrated in step 2

## Phase Status Legend

| Emoji | Status |
|-------|--------|
| ⬜ | Not started |
| 🔄 | In progress |
| ✅ | Completed |

## Current Status
- **Current Phase**: Phase 3 (Migrate NotesController)
- **Progress**: 2/7
