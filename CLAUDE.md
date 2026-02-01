# K7Notes

A cross-platform note-taking application with React Native (Expo) mobile app, web interface, and NestJS backend.

## Tech Stack

- **Frontend/Mobile**: React Native 0.76 + Expo SDK 52, Expo Router (file-based routing), TenTap Editor (rich text)
- **Backend**: NestJS 11, PostgreSQL, Drizzle ORM
- **API**: oRPC for end-to-end type safety with Zod validation
- **Auth**: Better-auth with email/password and Google OAuth
- **Monorepo**: pnpm workspaces + Turborepo

## Project Structure

```
apps/
  api/           # NestJS backend (port 4000)
  mobile/        # React Native Expo app (port 4001)
  landing/       # Vite landing page (port 5173)
packages/
  contracts/     # Shared oRPC contracts and Zod schemas
  eslint-config/ # Shared ESLint rules
  typescript-config/
```

## Commands

```bash
# Root level
pnpm dev          # Start all apps in development
pnpm build        # Build all apps
pnpm lint         # Lint all workspaces
pnpm type-check   # Type check all TypeScript

# API
pnpm turbo dev --filter=@k7notes/api       # Start API with hot reload (builds deps first)
pnpm turbo db:push --filter=@k7notes/api   # Push schema to database (dev)
pnpm turbo db:migrate --filter=@k7notes/api # Run migrations
pnpm turbo db:studio --filter=@k7notes/api # Open Drizzle Studio

# Mobile
pnpm turbo dev --filter=@k7notes/mobile    # Start Expo CLI (builds deps first)
pnpm turbo ios --filter=@k7notes/mobile    # Start iOS simulator (builds deps first)
pnpm turbo android --filter=@k7notes/mobile # Start Android emulator (builds deps first)
pnpm turbo web --filter=@k7notes/mobile    # Start web version (builds deps first)

# Landing
pnpm turbo dev --filter=@k7notes/landing   # Start Vite dev server (builds deps first)
```

## Architecture

### Server-First Design
- Backend is source of truth for all data and business logic
- Frontend is a thin client consuming oRPC APIs
- Authentication validated server-side via session tokens

### oRPC Contract Pattern
1. Define contracts in `packages/contracts/src/contracts/`
2. Implement in backend controllers with `@Implement(contract.xxx)` decorator
3. Consume in frontend via typed `orpc` client

### Route Structure (Mobile)
```
(auth)/          # Unauthenticated routes
  login.tsx
  signup.tsx
(app)/           # Protected routes (require auth)
  notes/index.tsx           # Notes list with folder tree
  notes/new.tsx             # Create new note
  notes/[id].tsx            # Edit note
  notes/folder/[id].tsx     # View folder contents
  search/index.tsx          # Full-text search
  recents/index.tsx         # Recently modified
  settings/index.tsx        # User settings
```

### Platform-Specific Files
- `auth.ts` / `auth.web.ts` - Different auth storage (SecureStore vs cookies)
- `_layout.tsx` / `_layout.web.tsx` - Tab bar (mobile) vs sidebar (web)

## Key Files

### Backend
- `apps/api/src/db/schema.ts` - Database tables (user, session, folders, notes)
- `apps/api/src/auth/auth.config.ts` - Better-auth configuration
- `apps/api/src/notes/notes.service.ts` - Notes business logic
- `apps/api/src/folders/folders.service.ts` - Folders business logic

### Frontend
- `apps/mobile/src/lib/orpc.ts` - oRPC client with auth cookie handling
- `apps/mobile/src/lib/auth.ts` - Better-auth mobile client
- `apps/mobile/src/components/editor/NoteEditor.tsx` - Rich text editor

### Contracts
- `packages/contracts/src/contracts/notes.ts` - Notes RPC routes
- `packages/contracts/src/contracts/folders.ts` - Folders RPC routes
- `packages/contracts/src/schemas/` - Zod validation schemas

## Database

PostgreSQL with Drizzle ORM. Key tables:
- `user`, `session`, `account`, `verification` - Better-auth managed
- `folders` - Self-referencing hierarchy via `parentId`
- `notes` - User notes with optional `folderId`

Full-text search uses PostgreSQL `tsvector`/`tsquery` with ranking and highlighting.

## Environment Variables

### API (`apps/api/.env`)
```
PORT=4000
BASE_URL=http://localhost:4000
DATABASE_URL=postgresql://...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### Mobile (`apps/mobile/.env`)
```
EXPO_PUBLIC_API_URL=http://localhost:4000
```

## Code Conventions

- **TypeScript strict mode** enabled everywhere
- **Path aliases**: `@/*` maps to `./src/*` in mobile app
- **Components**: Functional with React Hooks
- **API handlers**: `@Implement(contract)` + `implement().handler()` pattern
- **Dates**: ISO 8601 strings over wire, coerced via Zod
- **HTML/Markdown**: Bidirectional conversion in editor (showdown/turndown)

## Development Setup

1. Install dependencies: `pnpm install`
2. Copy `.env.example` to `.env` in `apps/api` and `apps/mobile`
3. Set up PostgreSQL and configure `DATABASE_URL`
4. Push database schema: `pnpm -F @k7notes/api db:push`
5. Start development: `pnpm dev`
