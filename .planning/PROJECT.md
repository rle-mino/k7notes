# K7Notes

## What This Is

An AI-powered note-taking app built with React Native for mobile, tablet, and web. It combines markdown editing (Obsidian-style with folders) with intelligent features: an AI agent that searches and writes notes, live audio transcription with speaker diarization, and calendar integration that makes meeting capture seamless. Mobile-first, local-first with cloud sync.

## Core Value

Seamless meeting capture: walk into a meeting, and the app handles everything — pre-created notes from calendar, live transcription, speaker tagging, smart filing — so you can focus on the conversation.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Markdown editor with Obsidian-style folder organization
- [ ] React Native app running on mobile, tablet, and web
- [ ] AI agent search (multi-step, iterative, like Claude Code)
- [ ] AI note writing via single input bar with smart file/folder placement
- [ ] Live audio transcription with real-time display
- [ ] Post-recording processing (cleanup, structuring)
- [ ] Speaker diarization (solo memos, in-person, virtual meetings)
- [ ] Audio input from live mic and uploaded files
- [ ] Calendar integration (Google/Outlook) for meeting details
- [ ] Pre-created meeting notes with attendees, agenda, links
- [ ] Speaker tagging using calendar attendee data
- [ ] Auto-organization of notes based on context and calendar
- [ ] Meeting prep: AI surfaces relevant past notes before meetings
- [ ] Local-first storage with cloud sync across devices

### Out of Scope

- Team collaboration / shared workspaces — defer to v2+
- Self-hosted AI models — using cloud APIs only
- Desktop native app — React Native web covers desktop use case

## Context

**Target user:** Solo professionals who have lots of meetings and need to capture, organize, and retrieve information efficiently. Start with individual users, team features come later.

**Technical approach:**
- React Native (Expo) for cross-platform from single codebase
- Mobile-first design, web adapts
- Cloud APIs for AI (transcription, LLM, diarization)
- Local-first data with sync layer

**Key integrations:**
- Calendar APIs (Google Calendar, Outlook)
- Speech-to-text API with diarization support
- LLM API for agent capabilities

## Constraints

- **Platform:** React Native — must work on iOS, Android, and web from same codebase
- **AI:** Cloud APIs only — no self-hosted model infrastructure
- **Storage:** Local-first — app must work offline, sync when connected
- **Privacy:** Audio and notes contain sensitive meeting content — needs secure handling

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React Native over native | Single codebase for all platforms, mobile-first | — Pending |
| Cloud APIs for AI | Simplifies infrastructure, focus on product not ML ops | — Pending |
| Local-first architecture | Offline capability essential for mobile note-taking | — Pending |
| Mobile-first design | Primary use case is capturing notes on the go | — Pending |

---
*Last updated: 2025-01-31 after initialization*
