# Technology Stack

**Project:** K7Notes
**Researched:** 2026-01-31
**Confidence:** HIGH

## Monorepo Structure

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Turborepo** | 2.x | Monorepo build system | Fast incremental builds, remote caching, task orchestration. Ideal for shared code between mobile app and backend. |
| **pnpm** | 9.x | Package manager | Workspace support, disk-efficient, strict dependency resolution. Best pairing with Turborepo. |

**Monorepo structure:**
```
k7notes/
├── apps/
│   ├── mobile/          # React Native (Expo) app
│   └── api/             # NestJS backend
├── packages/
│   ├── shared/          # Shared types, utils, constants
│   ├── db/              # Drizzle schema, migrations
│   └── ai/              # AI agent logic (shared between platforms)
├── turbo.json
└── pnpm-workspace.yaml
```

**Confidence:** HIGH - Turborepo is the standard for TypeScript monorepos in 2026

## Recommended Stack

### Core Framework (Mobile)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Expo** | SDK 54+ | React Native framework | Managed workflow with native APIs, web support, and streamlined builds. Expo's local-first architecture support is mature in 2026. |
| **React Native** | 0.73+ | Cross-platform mobile framework | Industry standard for iOS/Android/Web from single codebase. TypeScript by default in 0.71+. |
| **TypeScript** | 5.3+ | Type safety | Eliminates runtime errors, included by default in React Native. Enterprise standard. |

**Confidence:** HIGH - Verified via [Expo Documentation](https://docs.expo.dev/guides/local-first/) and [React Native TypeScript Docs](https://reactnative.dev/docs/typescript)

### Backend

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **NestJS** | 10.x | Backend framework | TypeScript-native, modular architecture, excellent for APIs. Built-in support for WebSockets (transcription streaming), queues (background jobs), and OpenAPI docs. |
| **PostgreSQL** | 16.x | Primary database | Industry standard, excellent for structured data, full-text search, JSON support. Handles notes, meetings, user data. |
| **Drizzle ORM** | 0.30+ | Database toolkit | TypeScript-first, lightweight, SQL-like syntax. Better DX than Prisma for complex queries. Migrations built-in. |
| **Redis** | 7.x | Caching & queues | LLM response caching, background job queues, rate limiting. Essential for cost control. |

**Confidence:** HIGH - NestJS + Drizzle + PostgreSQL is proven production stack

### Database & Sync

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **SQLite** (mobile) | expo-sqlite | Local-first storage on device | Fast, embedded, works offline. Expo's recommended approach for local-first. |
| **PostgreSQL** (server) | 16.x | Server-side persistence | Source of truth, handles sync conflicts, full-text search for AI agent. |
| **Drizzle ORM** | 0.30+ | Shared schema | Same schema definitions for mobile SQLite and server PostgreSQL. Type-safe queries in both environments. |

**Sync strategy:**
- Mobile writes to local SQLite immediately (optimistic updates)
- Background sync to PostgreSQL via NestJS API
- Conflict resolution via timestamps + user choice for conflicts
- Drizzle schema shared in `packages/db`

**Confidence:** HIGH - Drizzle supports both SQLite and PostgreSQL with same schema definitions

### State Management

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Zustand** | 5.0.10+ | Global state management | 30% YoY growth, appears in 40% of projects (2026). No boilerplate, automatic optimization, no Provider needed. Perfect for small-medium complexity apps. Redux is overkill for this use case. |

**Confidence:** HIGH - [Zustand vs Redux comparison](https://betterstack.com/community/guides/scaling-nodejs/zustand-vs-redux/) shows Zustand is ideal for this project size

### Audio Recording & Transcription

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **expo-audio** | 1.1.1+ | Audio recording/playback | Official Expo package, replaces deprecated expo-av. Modern hooks-based API (`useAudioRecorder`, `useAudioPlayer`). Works iOS/Android/Web. |
| **AssemblyAI** | API | Cloud transcription + diarization | 96-98% accuracy, handles up to 50 speakers, includes sentiment analysis. $0.15/hr base + $0.02/hr for diarization. Best accuracy-to-feature ratio. |

**Alternative considerations:**
- **Deepgram** - Better for real-time (sub-300ms latency), includes diarization free. Choose if live transcription is priority over accuracy.
- **OpenAI Whisper API** - 94-96% accuracy, best multilingual support (99 languages), but lacks native diarization. WhisperX adds diarization but requires custom integration.

**Confidence:** HIGH for expo-audio (verified via [Expo Docs](https://docs.expo.dev/versions/latest/sdk/audio/)), MEDIUM for AssemblyAI (based on multiple [comparison articles](https://www.index.dev/skill-vs-skill/ai-whisper-vs-assemblyai-vs-deepgram))

### AI/LLM Integration

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **OpenAI API** | Latest | GPT models for AI features | Industry standard, server-side proxy pattern for API key security. Streaming supported. |
| **Anthropic API** | Latest | Claude models (alternative/complement) | Best for longer context needs, excellent instruction following. |
| **LiteLLM** (optional) | Latest | API gateway | Normalizes 100+ providers into OpenAI format. Use if multi-provider strategy needed. |

**Architecture:** Server-side proxy required for API key security. Never expose keys in mobile app.

**Confidence:** HIGH - [React Native AI best practices](https://www.callstack.com/blog/announcing-react-native-best-practices-for-ai-agents) confirm server proxy pattern

### Markdown Editing & Display

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **react-native-markdown-display** | 8.1.1+ | Markdown rendering | Actively maintained fork of react-native-markdown-renderer. 100% CommonMark compatible, native components (no WebView). Supports markdown-it plugins for custom syntax. |
| **Custom editor** | N/A | Markdown editing | No production-ready Obsidian-style editor exists for React Native. Build custom TextInput with markdown shortcuts. See Expo's [rich text editing guide](https://docs.expo.dev/guides/editing-richtext/). |

**Confidence:** MEDIUM - react-native-markdown-display verified as actively maintained, but no perfect solution for advanced editing (bidirectional links, graph view)

### Calendar Integration

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|---|
| **expo-calendar** | 15.0.8+ | Device calendar access | Official Expo package. Accesses device's system calendars (reads Google Calendar, iCloud, Outlook events synced to device). SDK 55 beta introduces object-oriented API (`expo-calendar/next`). |

**Important limitations:**
- Reads calendars synced to device, not direct Google/Outlook API integration
- Organizer info (email) is read-only for external calendars (Google, iCloud)
- For creating events in Google Calendar/Outlook directly, need their REST APIs separately

**Confidence:** MEDIUM - [Expo Calendar Docs](https://docs.expo.dev/versions/latest/sdk/calendar/) verified, but indirect integration may not meet all requirements

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@react-native-async-storage/async-storage** | Latest | Key-value storage | User preferences, settings, small data. Not for notes/meeting data. |
| **expo-secure-store** | Latest | Encrypted storage | Auth tokens, API keys. iOS Keychain / Android Keystore backed. |
| **react-native-big-calendar** | Latest | Calendar UI component | Display meetings in gcal/outlook style UI within app. |

**Confidence:** HIGH - All are official Expo/React Native packages

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **ESLint** | Code linting | TypeScript-aware rules |
| **Prettier** | Code formatting | Standard formatting |
| **Jest** | Unit testing | Included by default in React Native |
| **Expo Dev Client** | Development builds | Custom native code support |

## Installation

```bash
# Initialize monorepo
pnpm dlx create-turbo@latest k7notes
cd k7notes

# Create mobile app (Expo)
cd apps
pnpm dlx create-expo-app mobile --template

# Create API (NestJS)
pnpm dlx @nestjs/cli new api --package-manager pnpm

# Shared packages
cd ../packages
mkdir shared db ai

# Mobile dependencies
cd ../apps/mobile
pnpm add expo-audio expo-calendar expo-secure-store expo-sqlite
pnpm add zustand react-native-markdown-display
pnpm add drizzle-orm

# API dependencies
cd ../api
pnpm add @nestjs/config @nestjs/bull bull
pnpm add drizzle-orm postgres
pnpm add ioredis
pnpm add -D drizzle-kit

# Shared DB package
cd ../../packages/db
pnpm add drizzle-orm
pnpm add -D drizzle-kit
```

## Alternatives Considered

| Category | Recommended | Alternative | When to Use Alternative |
|----------|-------------|-------------|-------------------------|
| Monorepo | Turborepo | Nx | Need more opinionated structure, larger enterprise team |
| Backend | NestJS | Fastify | Need maximum performance, smaller API surface |
| ORM | Drizzle | Prisma | Need more mature tooling, don't need raw SQL control |
| ORM | Drizzle | Kysely | Need pure query builder without ORM features |
| Database | PostgreSQL | SQLite (server) | Single-server deployment, simpler ops |
| State | Zustand | Redux Toolkit | Large team, complex shared state, need middleware ecosystem |
| Transcription | AssemblyAI | Deepgram | Real-time latency critical, budget-conscious (diarization free) |
| Transcription | AssemblyAI | OpenAI Whisper | Multilingual critical (99 languages), on-premise needs |
| Calendar | expo-calendar | Google/Outlook APIs | Need to create events directly without device calendar |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **expo-av** | Deprecated as of 2026, replaced by expo-audio and expo-video | **expo-audio** (1.1.1+) |
| **react-native-markdown-renderer** | No longer maintained, last update years ago | **react-native-markdown-display** (actively maintained fork) |
| **react-native-calendar-events** | Last updated 5 years ago (2021), may not work with current RN | **expo-calendar** (actively maintained, official) |
| **Redux** (classic) | Excessive boilerplate for this project size, down to 10% of new projects | **Zustand** for simple cases, **Redux Toolkit** if complexity demands |
| **On-device LLMs** | Meeting notes require cloud AI quality, context length, and speaker diarization unavailable on-device | **Cloud APIs** (OpenAI, Anthropic, AssemblyAI) |
| **Prisma** | Heavier runtime, less SQL control, slower for complex queries | **Drizzle ORM** (lightweight, SQL-like) |
| **Express.js** | Less structure, no built-in DI, harder to maintain at scale | **NestJS** (modular, TypeScript-native) |
| **Supabase** (as primary) | Less control over backend logic, vendor lock-in | **Self-hosted PostgreSQL + NestJS** for full control |
| **Lerna/Yarn workspaces alone** | Slower builds, no remote caching | **Turborepo** for build orchestration |

## Stack Patterns by Feature

### If building MVP first:
- **Phase 1:** Expo + TypeScript + Zustand + AsyncStorage (no WatermelonDB yet)
- **Phase 2:** Add WatermelonDB when local-first becomes critical
- **Phase 3:** Add Supabase sync after local-first proven

### If building offline-first from start:
- Start with full stack: WatermelonDB + Supabase from day one
- Higher initial complexity but avoids migration pain

### If real-time transcription is priority:
- Use **Deepgram** instead of AssemblyAI
- Accept lower accuracy (95% vs 98%) for sub-300ms latency

### If budget-conscious:
- **Deepgram** - diarization included free
- **Whisper API** - lower cost per hour
- Trade-off: AssemblyAI's audio intelligence features (sentiment, content moderation) worth premium

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| expo-audio@1.1.1 | Expo SDK 54+ | Bundled version ~1.1.1 |
| WatermelonDB@0.28.0 | React Native 0.60+ | Works with latest RN, peer dependency checks |
| Zustand@5.0.10 | React 18+ | No special RN considerations |
| expo-calendar@15.0.8 | Expo SDK 54+ | SDK 55 beta introduces /next API |

## Direct API Integration Requirements

For features requiring direct API access (not via Expo SDK):

### Google Calendar API
- OAuth 2.0 flow (use expo-auth-session)
- REST API for event creation
- Scopes: calendar.events.readonly, calendar.events

### Microsoft Outlook Calendar API
- Microsoft Graph API
- OAuth 2.0 via Azure AD
- Scopes: Calendars.Read, Calendars.ReadWrite

**Recommendation:** Start with expo-calendar for MVP (reads device-synced calendars). Add direct API integration later if creating events programmatically becomes critical.

## Cloud Service Dependencies

| Service | Purpose | Pricing Model |
|---------|---------|---------------|
| **Supabase** | Backend sync, auth, storage | Free tier: 500MB, 2GB egress. Paid: $25/mo |
| **AssemblyAI** | Transcription + diarization | $0.17/hr (base + diarization) |
| **OpenAI** | LLM for AI features | GPT-4o: $2.50/1M input tokens, $10/1M output |
| **Anthropic** | LLM alternative | Claude Sonnet: $3/1M input, $15/1M output |

## Sources

### High Confidence (Official Documentation)
- [Expo Local-First Architecture](https://docs.expo.dev/guides/local-first/) - Official recommendations for 2026
- [Expo Audio Documentation](https://docs.expo.dev/versions/latest/sdk/audio/) - expo-av deprecation confirmed
- [React Native TypeScript](https://reactnative.dev/docs/typescript) - TypeScript by default since 0.71
- [Expo Calendar](https://docs.expo.dev/versions/latest/sdk/calendar/) - Version 15.0.8, SDK 55 beta changes
- [WatermelonDB GitHub](https://github.com/Nozbe/WatermelonDB) - Active maintenance confirmed

### Medium Confidence (Multiple Sources)
- [Supabase + WatermelonDB Tutorial](https://supabase.com/blog/react-native-offline-first-watermelon-db) - Proven integration
- [AssemblyAI vs Deepgram vs Whisper Comparison](https://www.index.dev/skill-vs-skill/ai-whisper-vs-assemblyai-vs-deepgram) - 2026 comparison
- [Zustand vs Redux 2026](https://betterstack.com/community/guides/scaling-nodejs/zustand-vs-redux/) - Market share data
- [React Native AI Best Practices](https://www.callstack.com/blog/announcing-react-native-best-practices-for-ai-agents) - Server proxy pattern
- [react-native-markdown-display NPM](https://www.npmjs.com/package/react-native-markdown-display) - Version 8.1.1 verified

### Lower Confidence (Needs Validation)
- Calendar API integration approach - May require deeper research during implementation
- Markdown editor custom solution - No proven Obsidian-style library exists
- Legend-State as WatermelonDB alternative - Newer, less proven in production

---
*Stack research for: AI-powered note-taking app with meeting capture*
*Researched: 2026-01-31*
*Focus: React Native (Expo), local-first, audio transcription, AI agents*
