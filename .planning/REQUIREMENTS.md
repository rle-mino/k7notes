# Requirements: K7Notes

**Defined:** 2026-01-31
**Core Value:** Seamless meeting capture — walk into a meeting, and the app handles everything (pre-created notes, live transcription, speaker tagging, smart filing)

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Platform

- [x] **PLAT-01**: App runs on iOS (iPhone)
- [x] **PLAT-02**: App runs on Android phones
- [x] **PLAT-03**: App runs in web browsers
- [x] **PLAT-04**: App is optimized for tablets (iPad, Android tablets)
- [x] **PLAT-05**: Codebase is Turborepo monorepo with shared packages

### Authentication

- [x] **AUTH-01**: User can sign up with email and password
- [x] **AUTH-02**: User can sign in with Google OAuth
- [x] **AUTH-03**: User session persists across app restarts
- [x] **AUTH-04**: User can log out from any screen

### Note-Taking

- [ ] **NOTE-01**: User can create, edit, and delete notes in markdown format
- [ ] **NOTE-02**: User can organize notes in nested folders
- [ ] **NOTE-03**: User can move notes between folders
- [ ] **NOTE-04**: User can search across all note content (full-text)
- [ ] **NOTE-05**: Notes render markdown with proper formatting (headers, lists, code blocks, etc.)

### Audio & Transcription

- [ ] **AUDIO-01**: User can record audio from device microphone
- [ ] **AUDIO-02**: Recording continues when app is backgrounded (up to 90 minutes)
- [ ] **AUDIO-03**: User sees live transcription as they speak
- [ ] **AUDIO-04**: User can upload pre-recorded audio files for transcription
- [ ] **AUDIO-05**: Transcription identifies different speakers (diarization)
- [ ] **AUDIO-06**: User can play back recorded audio with timestamps linked to transcript
- [ ] **AUDIO-07**: Recording requires explicit user consent with visible indicator

### Calendar Integration

- [ ] **CAL-01**: App reads user's calendar (Google Calendar, device calendar)
- [ ] **CAL-02**: App auto-creates meeting note with title, date, and attendees before meeting
- [ ] **CAL-03**: Speaker labels use attendee names from calendar when possible

### AI Features

- [ ] **AI-01**: AI generates summary and action items from meeting transcripts
- [ ] **AI-02**: User can search notes with AI agent (multi-step, iterative like Claude Code)
- [ ] **AI-03**: User can write notes via single input bar that AI files to correct location
- [ ] **AI-04**: AI suggests folder/file for new notes based on content context
- [ ] **AI-05**: User can override AI filing decisions

### Sync & Storage

- [ ] **SYNC-01**: Notes save locally immediately (works offline)
- [ ] **SYNC-02**: Notes sync to cloud when online
- [ ] **SYNC-03**: User can access notes from multiple devices
- [ ] **SYNC-04**: App handles sync conflicts (shows both versions, user chooses)
- [ ] **SYNC-05**: Sync status is visible to user (synced, syncing, offline)

### Backend

- [x] **BACK-01**: NestJS API handles authentication, sync, and AI operations
- [x] **BACK-02**: PostgreSQL stores user data, notes, meetings
- [x] **BACK-03**: Drizzle ORM with shared schema between mobile SQLite and server PostgreSQL
- [ ] **BACK-04**: Redis caches LLM responses to control costs
- [ ] **BACK-05**: API rate limits AI operations per user

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced Notes

- **NOTE-V2-01**: Bidirectional note linking (backlinks, graph view)
- **NOTE-V2-02**: Note templates for meeting types
- **NOTE-V2-03**: Rich media embeds (images, files)

### Calendar

- **CAL-V2-01**: Outlook Calendar integration (Microsoft Graph API)
- **CAL-V2-02**: AI surfaces relevant past notes before meetings (meeting prep)
- **CAL-V2-03**: Create calendar events from within app

### Collaboration

- **COLLAB-01**: Share notes via link
- **COLLAB-02**: Team workspaces with shared folders
- **COLLAB-03**: Real-time collaborative editing

### Advanced Audio

- **AUDIO-V2-01**: Multi-language transcription
- **AUDIO-V2-02**: Custom vocabulary/jargon training
- **AUDIO-V2-03**: Noise cancellation preprocessing

### Integrations

- **INT-01**: Export to Notion, Google Docs
- **INT-02**: Slack integration (share summaries)
- **INT-03**: Zapier/webhook integrations

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Desktop native apps (Electron) | React Native Web covers desktop use case adequately |
| Video recording | Complexity + storage costs; audio is sufficient for meeting capture |
| On-device AI models | Cloud APIs provide better quality; cost optimization via caching instead |
| Apple Sign-In | Can add in v1.1 if App Store requires; Google OAuth sufficient for launch |
| Self-hosted deployment | Focus on SaaS first; self-hosted adds ops complexity |
| End-to-end encryption | Adds significant complexity; standard encryption in transit/at rest for v1 |
| Offline AI features | AI requires cloud APIs; offline mode is for note editing only |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLAT-01 | Phase 1 | Complete |
| PLAT-02 | Phase 1 | Complete |
| PLAT-03 | Phase 1 | Complete |
| PLAT-04 | Phase 1 | Complete |
| PLAT-05 | Phase 1 | Complete |
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| BACK-01 | Phase 1 | Complete |
| BACK-02 | Phase 1 | Complete |
| BACK-03 | Phase 1 | Complete |
| NOTE-01 | Phase 2 | Pending |
| NOTE-02 | Phase 2 | Pending |
| NOTE-03 | Phase 2 | Pending |
| NOTE-04 | Phase 2 | Pending |
| NOTE-05 | Phase 2 | Pending |
| AUDIO-01 | Phase 3 | Pending |
| AUDIO-02 | Phase 3 | Pending |
| AUDIO-03 | Phase 3 | Pending |
| AUDIO-04 | Phase 3 | Pending |
| AUDIO-05 | Phase 3 | Pending |
| AUDIO-06 | Phase 3 | Pending |
| AUDIO-07 | Phase 3 | Pending |
| CAL-01 | Phase 4 | Pending |
| CAL-02 | Phase 4 | Pending |
| CAL-03 | Phase 4 | Pending |
| SYNC-01 | Phase 5 | Pending |
| SYNC-02 | Phase 5 | Pending |
| SYNC-03 | Phase 5 | Pending |
| SYNC-04 | Phase 5 | Pending |
| SYNC-05 | Phase 5 | Pending |
| AI-01 | Phase 6 | Pending |
| AI-02 | Phase 6 | Pending |
| AI-03 | Phase 6 | Pending |
| AI-04 | Phase 6 | Pending |
| AI-05 | Phase 6 | Pending |
| BACK-04 | Phase 6 | Pending |
| BACK-05 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 39 total
- Mapped to phases: 39
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-31*
*Last updated: 2026-01-31 after roadmap creation*
