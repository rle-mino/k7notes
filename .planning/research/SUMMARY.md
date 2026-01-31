# Project Research Summary

**Project:** K7Notes
**Domain:** AI-powered note-taking with meeting capture
**Researched:** 2026-01-31
**Confidence:** HIGH

## Executive Summary

K7Notes sits at the intersection of note-taking (Obsidian, Notion) and meeting capture (Otter, Fireflies). The market is mature for transcription (90%+ accuracy is commoditized) but underdeveloped for intelligent workflows. The key insight: **don't compete on transcription accuracy — compete on workflow automation, bot-free capture, and AI agent intelligence**.

The recommended architecture is a Turborepo monorepo with React Native (Expo) for mobile/tablet/web and NestJS + PostgreSQL + Drizzle for the backend. This gives full control over the AI pipeline, enables shared TypeScript code, and avoids vendor lock-in. Local-first architecture with SQLite on device syncing to PostgreSQL is critical — retrofitting offline support later is extremely painful.

Critical risks to address early: (1) Recording consent flows must be legally compliant from day 1 (all-party consent), (2) LLM API costs can explode without rate limiting and caching, (3) Background recording fails silently on iOS 18/Android 15 without proper foreground service configuration, (4) Speaker diarization accuracy is 70-80% in real conditions, not 95% — set expectations and provide manual correction UI.

## Key Findings

### Recommended Stack

**Monorepo + Backend:**
- **Turborepo** — build orchestration, remote caching
- **NestJS** — TypeScript backend, WebSocket support for streaming
- **PostgreSQL + Drizzle** — server database with type-safe ORM
- **Redis** — caching, queues, rate limiting

**Mobile + Web:**
- **Expo (React Native)** — iOS, Android, Web from single codebase
- **SQLite (expo-sqlite)** — local-first storage
- **Zustand** — state management
- **expo-audio** — recording (replaces deprecated expo-av)

**AI Services (Cloud APIs):**
- **AssemblyAI** — transcription + speaker diarization (96-98% accuracy)
- **OpenAI/Anthropic** — LLM for summaries, AI agent, smart filing

### Expected Features

**Must have (table stakes):**
- Real-time transcription with speaker diarization
- AI-generated summaries and action items
- Cross-platform sync (mobile + web)
- Calendar integration (pre-populated meeting notes)
- Full-text search
- Markdown editing with folders

**Should have (differentiators):**
- **Bot-free capture** — local audio processing, no "Fireflies has joined"
- **AI Agent search** — multi-step iterative search like Claude Code
- **Unified input bar** — single input that auto-files to correct location
- **Dual audio sources** — live mic AND uploaded files
- **Local-first architecture** — instant writes, works offline

**Defer (v2+):**
- Multi-language support (start English-only)
- Collaborative real-time editing
- Video recording
- Custom AI models

### Architecture Approach

Local-first with async cloud sync:

```
Mobile App (Expo)          NestJS Backend
┌──────────────────┐      ┌──────────────────┐
│ SQLite (local)   │ ──── │ PostgreSQL       │
│ Zustand (state)  │ sync │ Redis (cache)    │
│ expo-audio       │      │ Bull (queues)    │
└──────────────────┘      └──────────────────┘
         │                         │
         │    ┌────────────────────┤
         │    │ External Services  │
         │    ├────────────────────┤
         └────│ AssemblyAI (transcription)
              │ OpenAI/Anthropic (LLM)
              │ Google/Outlook Calendar APIs
              └────────────────────┘
```

**Build order:** Foundation (DB, state) → Core notes → Audio recording → Calendar → Cloud sync → AI agent

### Critical Pitfalls

1. **Local-first sync conflicts** — Use proper conflict resolution (timestamps + user choice), not "last-write-wins" which silently drops changes
2. **Recording privacy violations** — All-party consent required in 12+ states; must have explicit opt-in, visible indicator, consent records
3. **Background recording fails** — iOS 18/Android 15 kill background tasks; need foreground services and UIBackgroundModes
4. **LLM cost explosion** — Rate limit free tier, cache responses, chunk transcripts, use smaller models where possible
5. **Speaker diarization accuracy** — Real-world accuracy is 70-80%, not 95%; provide manual correction UI

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation
**Rationale:** Everything depends on database schema, state management, and project structure. Must get local-first architecture right early.
**Delivers:** Turborepo monorepo, NestJS API scaffold, Expo app scaffold, Drizzle schema, basic auth
**Addresses:** Project structure, development workflow
**Avoids:** Sync conflict hell (by choosing architecture early)

### Phase 2: Core Note-Taking
**Rationale:** Validates basic UX before adding complexity. Markdown editing is table stakes.
**Delivers:** Note CRUD, folder organization, markdown editor, basic search
**Addresses:** Table stakes features (FEATURES.md)
**Uses:** SQLite, Zustand, Drizzle (STACK.md)

### Phase 3: Audio Recording & Transcription
**Rationale:** Core differentiator. Bot-free local capture is the key value prop.
**Delivers:** Audio recording, live transcription, speaker diarization, meeting notes
**Addresses:** Real-time transcription, speaker diarization (FEATURES.md)
**Avoids:** Background recording failures (PITFALLS.md)

### Phase 4: Calendar Integration
**Rationale:** Enables pre-meeting workflow, the "seamless capture" core value.
**Delivers:** Calendar sync, pre-created meeting notes, attendee context
**Addresses:** Calendar integration (FEATURES.md)
**Avoids:** Webhook expiration issues (PITFALLS.md)

### Phase 5: Cloud Sync
**Rationale:** Multi-device support. Build after local-first proven.
**Delivers:** Background sync, conflict resolution, sync status UI
**Addresses:** Cross-platform sync (FEATURES.md)
**Avoids:** Sync conflict hell (PITFALLS.md)

### Phase 6: AI Agent
**Rationale:** Major differentiator. Requires sync to work (needs full note corpus).
**Delivers:** AI search (multi-step), smart filing, meeting summaries
**Addresses:** AI Agent Search, unified input bar (FEATURES.md)
**Avoids:** LLM cost explosion (PITFALLS.md)

### Phase Ordering Rationale

- **Foundation before features:** Architecture decisions (local-first, sync strategy, LLM cost model) must be made early; retrofitting is expensive
- **Core notes before audio:** Validate basic note UX before adding recording complexity
- **Audio before calendar:** Recording works standalone; calendar enhances it
- **Sync before AI agent:** Agent needs full note corpus; sync enables multi-device knowledge base
- **AI agent last:** Highest complexity, depends on everything else working

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Audio):** Background recording permissions, platform-specific audio APIs
- **Phase 4 (Calendar):** Google/Outlook OAuth flows, webhook renewal patterns
- **Phase 6 (AI Agent):** Vector search implementation, prompt engineering for note context

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Well-documented Turborepo + NestJS + Expo patterns
- **Phase 2 (Core Notes):** Standard CRUD, many examples exist
- **Phase 5 (Sync):** Established patterns for optimistic updates + background sync

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Turborepo + NestJS + Drizzle + Expo is proven stack; user specified preferences |
| Features | HIGH | Validated across 20+ competitor products and industry sources |
| Architecture | HIGH | Local-first patterns well-documented; Expo official guidance exists |
| Pitfalls | HIGH | Multiple sources confirm recording privacy, sync conflicts, LLM costs |

**Overall confidence:** HIGH

### Gaps to Address

- **Markdown editor implementation:** No perfect Obsidian-style editor for React Native; may need custom solution or accept limitations
- **Calendar API specifics:** Google Calendar vs Microsoft Graph OAuth flows need phase-specific research
- **Audio quality handling:** How to detect and warn about poor audio before transcription?
- **Speaker labeling:** Automatic name assignment from calendar attendees is complex; may start with "Speaker 1, 2, 3"

## Sources

### Primary (HIGH confidence)
- [Expo Local-First Architecture](https://docs.expo.dev/guides/local-first/)
- [Expo Audio Documentation](https://docs.expo.dev/versions/latest/sdk/audio/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Turborepo Documentation](https://turbo.build/repo/docs)

### Secondary (MEDIUM confidence)
- [AssemblyAI vs Deepgram Comparison](https://www.index.dev/skill-vs-skill/ai-whisper-vs-assemblyai-vs-deepgram)
- [Local-First Architecture Patterns](https://evilmartians.com/chronicles/cool-front-end-arts-of-local-first-storage-sync-and-conflicts)
- [AI Note-Taking App Comparisons](https://www.lindy.ai/blog/ai-note-taking-app)

### Tertiary (LOW confidence)
- Speaker diarization accuracy claims need validation with real meeting audio
- LLM cost projections depend on actual usage patterns

---
*Research completed: 2026-01-31*
*Ready for roadmap: yes*
