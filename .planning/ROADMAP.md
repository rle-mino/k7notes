# Roadmap: K7Notes

## Overview

K7Notes delivers seamless meeting capture through six phases that build from foundation to intelligence. We establish the technical foundation and user accounts, then deliver core note-taking, add audio recording with live transcription, integrate calendar for pre-meeting workflows, enable multi-device sync, and finally layer on AI agent capabilities for smart search and filing.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Monorepo structure, authentication, and backend infrastructure
- [ ] **Phase 2: Core Note-Taking** - Markdown editing with folders and search
- [ ] **Phase 3: Audio & Transcription** - Recording, live transcription, and speaker diarization
- [ ] **Phase 4: Calendar Integration** - Pre-created meeting notes with attendee context
- [ ] **Phase 5: Cloud Sync** - Multi-device support with conflict resolution
- [ ] **Phase 6: AI Agent** - Smart search, filing, and meeting summaries

## Phase Details

### Phase 1: Foundation
**Goal**: User can sign up, log in, and access a working app on all platforms
**Depends on**: Nothing (first phase)
**Requirements**: PLAT-01, PLAT-02, PLAT-03, PLAT-04, PLAT-05, AUTH-01, AUTH-02, AUTH-03, AUTH-04, BACK-01, BACK-02, BACK-03
**Success Criteria** (what must be TRUE):
  1. User can run the app on iOS, Android, and web from a single codebase
  2. User can create an account with email/password
  3. User can sign in with Google OAuth
  4. User session persists across app restarts
  5. User can log out from any screen
**Plans**: 5 plans

Plans:
- [x] 01-01-PLAN.md — Initialize Turborepo monorepo with pnpm workspaces and shared configs
- [x] 01-02-PLAN.md — Scaffold NestJS backend with Drizzle ORM and PostgreSQL
- [x] 01-03-PLAN.md — Scaffold Expo mobile app with React Native and Expo Router
- [x] 01-04-PLAN.md — Implement email/password authentication with better-auth
- [x] 01-05-PLAN.md — Add Google OAuth sign-in and logout functionality

### Phase 2: Core Note-Taking
**Goal**: User can create, organize, and search markdown notes with WYSIWYG editing
**Depends on**: Phase 1
**Requirements**: NOTE-01, NOTE-02, NOTE-03, NOTE-04, NOTE-05
**Success Criteria** (what must be TRUE):
  1. User can create, edit, and delete markdown notes
  2. User can organize notes in nested folders
  3. User can move notes between folders
  4. User can search across all note content and find matches instantly
  5. Markdown renders correctly with headers, lists, code blocks, and formatting
**Plans**: 6 plans

Plans:
- [ ] 02-01-PLAN.md — Set up SQLite database with Drizzle ORM and migrations
- [ ] 02-02-PLAN.md — Implement note and folder CRUD with useLiveQuery hook
- [ ] 02-03-PLAN.md — Set up FTS5 full-text search with sync triggers
- [ ] 02-04-PLAN.md — Create 10tap-editor component with markdown conversion
- [ ] 02-05-PLAN.md — Build note list, folder navigation, and editor screens
- [ ] 02-06-PLAN.md — Complete search UI, move notes, and verify end-to-end

### Phase 3: Audio & Transcription
**Goal**: User can record meetings with live transcription and speaker identification
**Depends on**: Phase 2
**Requirements**: AUDIO-01, AUDIO-02, AUDIO-03, AUDIO-04, AUDIO-05, AUDIO-06, AUDIO-07
**Success Criteria** (what must be TRUE):
  1. User can record audio from device microphone with visible recording indicator
  2. Recording continues for up to 90 minutes when app is backgrounded
  3. User sees live transcription text appear as they speak
  4. User can upload pre-recorded audio files and receive transcripts
  5. Transcript shows different speakers labeled (Speaker 1, Speaker 2, etc.)
  6. User can play back recorded audio with transcript segments linked to timestamps
  7. User must explicitly consent to recording with clear consent flow
**Plans**: TBD

Plans:
- (Plans will be created during Phase 3 planning)

### Phase 4: Calendar Integration
**Goal**: User walks into meetings with pre-created notes populated from calendar
**Depends on**: Phase 3
**Requirements**: CAL-01, CAL-02, CAL-03
**Success Criteria** (what must be TRUE):
  1. User can connect their Google Calendar and device calendar to the app
  2. App automatically creates meeting notes before meetings with title, date, time, and attendees
  3. Speaker labels in transcripts match attendee names from calendar events
**Plans**: TBD

Plans:
- (Plans will be created during Phase 4 planning)

### Phase 5: Cloud Sync
**Goal**: User can access and edit notes from multiple devices seamlessly
**Depends on**: Phase 4
**Requirements**: SYNC-01, SYNC-02, SYNC-03, SYNC-04, SYNC-05
**Success Criteria** (what must be TRUE):
  1. Notes save locally immediately and app works without internet connection
  2. Notes automatically sync to cloud when device is online
  3. User can access the same notes from phone, tablet, and web
  4. When sync conflicts occur, user sees both versions and can choose which to keep
  5. Sync status indicator shows synced/syncing/offline states clearly
**Plans**: TBD

Plans:
- (Plans will be created during Phase 5 planning)

### Phase 6: AI Agent
**Goal**: User can search intelligently and let AI file notes automatically
**Depends on**: Phase 5
**Requirements**: AI-01, AI-02, AI-03, AI-04, AI-05, BACK-04, BACK-05
**Success Criteria** (what must be TRUE):
  1. User receives AI-generated summaries and action items from meeting transcripts
  2. User can search notes using AI agent that performs multi-step iterative searches
  3. User can create notes via single input bar and AI files them to correct location
  4. AI suggests folder and filename for new notes based on content
  5. User can override AI filing decisions and move notes manually
**Plans**: TBD

Plans:
- (Plans will be created during Phase 6 planning)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 5/5 | Complete | 2026-01-31 |
| 2. Core Note-Taking | 0/6 | Planned | - |
| 3. Audio & Transcription | 0/TBD | Not started | - |
| 4. Calendar Integration | 0/TBD | Not started | - |
| 5. Cloud Sync | 0/TBD | Not started | - |
| 6. AI Agent | 0/TBD | Not started | - |

---
*Roadmap created: 2026-01-31*
*Last updated: 2026-01-31 after Phase 2 planning (6 plans with 10tap-editor)*
