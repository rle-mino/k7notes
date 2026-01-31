# Architecture Research

**Domain:** AI-powered note-taking app with meeting capture
**Researched:** 2026-01-31
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Presentation Layer                           │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ Note     │  │ Meeting  │  │ Calendar │  │ Settings │            │
│  │ Editor   │  │ Recorder │  │ View     │  │ Screen   │            │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘            │
│       │             │             │             │                   │
├───────┴─────────────┴─────────────┴─────────────┴───────────────────┤
│                         State Management                             │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │   Zustand / Legend-State (Reactive State + Sync)             │   │
│  └──────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────┤
│                         Business Logic                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ Note     │  │ Audio    │  │ AI Agent │  │ Sync     │            │
│  │ Service  │  │ Service  │  │ Service  │  │ Engine   │            │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘            │
│       │             │             │             │                   │
├───────┴─────────────┴─────────────┴─────────────┴───────────────────┤
│                         Data Layer (Local-First)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ SQLite   │  │ MMKV     │  │ File     │  │ Audio    │            │
│  │ (Notes)  │  │ (Cache)  │  │ System   │  │ Files    │            │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘            │
│       │             │             │             │                   │
├───────┴─────────────┴─────────────┴─────────────┴───────────────────┤
│                         External Services                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ Transcr. │  │ AI/LLM   │  │ Calendar │  │ Cloud    │            │
│  │ API      │  │ API      │  │ API      │  │ Sync     │            │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Note Editor | Markdown editing, rendering, folder navigation | React Native TextInput with live markdown parsing or WebView wrapper |
| Meeting Recorder | Audio capture, live transcription UI, speaker tracking | expo-audio + WebSocket to transcription service |
| Calendar View | Calendar integration, meeting scheduling | expo-calendar + react-native-calendars for UI |
| State Management | Reactive state, offline-first data, sync coordination | Zustand or Legend-State with sync middleware |
| Note Service | CRUD operations, folder management, search | Business logic layer over SQLite |
| Audio Service | Recording, playback, streaming to API | expo-audio with chunked upload for real-time |
| AI Agent Service | Search queries, writing assistance, summarization | API client to LLM service with context management |
| Sync Engine | Conflict resolution, bi-directional sync | CRDT-based (Yjs) or last-write-wins with RxDB/Turso |
| SQLite Database | Structured note metadata, folder hierarchy | expo-sqlite or op-sqlite for performance |
| MMKV Cache | Fast key-value storage for UI state | react-native-mmkv (10x faster than AsyncStorage) |
| File System | Markdown files, audio recordings | expo-file-system |
| External APIs | Transcription (AssemblyAI/Deepgram), LLM (OpenAI), Calendar | REST/WebSocket clients |

## Recommended Project Structure

```
src/
├── app/                    # Expo Router screens (file-based routing)
│   ├── (tabs)/            # Bottom tab navigator
│   │   ├── index.tsx      # Notes list
│   │   ├── calendar.tsx   # Calendar view
│   │   └── settings.tsx   # Settings
│   ├── note/              # Note detail screens
│   │   └── [id].tsx       # Dynamic note editor
│   └── meeting/           # Meeting-related screens
│       └── [id].tsx       # Meeting recorder/viewer
├── components/            # Reusable UI components
│   ├── markdown/          # Markdown editor components
│   ├── audio/             # Audio player/recorder UI
│   └── common/            # Shared UI elements
├── services/              # Business logic (domain layer)
│   ├── notes/             # Note CRUD, folder management
│   ├── audio/             # Recording, transcription
│   ├── ai/                # AI agent interactions
│   ├── sync/              # Cloud sync logic
│   └── calendar/          # Calendar integration
├── store/                 # State management
│   ├── notes.ts           # Notes state
│   ├── meetings.ts        # Meeting state
│   ├── sync.ts            # Sync state
│   └── index.ts           # Store configuration
├── db/                    # Database layer
│   ├── schema.ts          # SQLite schema
│   ├── migrations/        # DB migrations
│   └── queries.ts         # SQL queries
├── lib/                   # Utilities and helpers
│   ├── api/               # API clients
│   ├── crdt/              # CRDT helpers (if using)
│   └── utils/             # General utilities
└── types/                 # TypeScript types
    ├── models.ts          # Data models
    └── api.ts             # API types
```

### Structure Rationale

- **app/:** Expo Router uses file-based routing, making navigation declarative and supporting deep linking out of the box
- **services/:** Domain logic separated from UI for testability and reusability across screens
- **store/:** Centralized state management with reactive updates to UI components
- **db/:** Abstraction layer over SQLite allows swapping implementations without changing services
- **Feature-based grouping:** Components and services are organized by domain (notes, audio, calendar) rather than technical role

## Architectural Patterns

### Pattern 1: Local-First with Optimistic Updates

**What:** All data operations execute against local SQLite first, UI updates immediately, then sync to cloud asynchronously

**When to use:** Always for note-taking apps where offline functionality is critical

**Trade-offs:**
- **Pro:** Instant UI responsiveness, works offline, better UX
- **Pro:** Reduced server costs (less real-time server dependency)
- **Con:** Conflict resolution complexity when syncing
- **Con:** Need to handle failed sync retries and conflict UI

**Example:**
```typescript
// services/notes/noteService.ts
export async function updateNote(id: string, content: string) {
  // 1. Update local DB immediately (optimistic)
  await db.updateNote(id, { content, updatedAt: Date.now() });

  // 2. Update UI via state management
  notesStore.updateNote(id, { content });

  // 3. Queue sync operation (async, non-blocking)
  syncQueue.enqueue({
    type: 'UPDATE_NOTE',
    id,
    payload: { content },
    timestamp: Date.now()
  });

  // 4. Sync happens in background
  // Conflicts resolved via CRDT or last-write-wins
}
```

### Pattern 2: MVVM with Container/View Split

**What:** Each screen has a container.tsx (logic) and view.tsx (UI), following Model-View-ViewModel pattern

**When to use:** For complex screens with significant business logic (meeting recorder, note editor)

**Trade-offs:**
- **Pro:** Clear separation of concerns, easier testing
- **Pro:** View components become purely presentational
- **Con:** More boilerplate for simple screens
- **Con:** Can feel over-engineered for CRUD screens

**Example:**
```typescript
// app/meeting/[id].container.tsx
export function MeetingRecorderContainer({ id }: { id: string }) {
  const { meeting, startRecording, stopRecording } = useMeetingRecorder(id);
  const { transcript, isTranscribing } = useTranscription(meeting?.audioUrl);

  return (
    <MeetingRecorderView
      meeting={meeting}
      transcript={transcript}
      isTranscribing={isTranscribing}
      onStartRecording={startRecording}
      onStopRecording={stopRecording}
    />
  );
}

// app/meeting/[id].view.tsx
export function MeetingRecorderView({ meeting, transcript, ... }) {
  // Pure UI, no business logic
  return <View>...</View>;
}
```

### Pattern 3: Service Layer with Dependency Injection

**What:** Services encapsulate all business logic and external dependencies, injected into React hooks

**When to use:** Always for testability and separation of concerns

**Trade-offs:**
- **Pro:** Easy to mock for testing
- **Pro:** Business logic reusable across React and non-React code
- **Con:** Additional abstraction layer
- **Con:** Requires more architectural discipline

**Example:**
```typescript
// services/audio/audioService.ts
export class AudioService {
  constructor(
    private transcriptionClient: TranscriptionClient,
    private storage: Storage
  ) {}

  async startRecording() {
    // Business logic independent of React
  }
}

// hooks/useAudioService.ts
export function useAudioService() {
  const service = useMemo(
    () => new AudioService(
      transcriptionClient,
      storage
    ),
    []
  );
  return service;
}
```

### Pattern 4: Streaming Audio with WebSocket + Chunking

**What:** Record audio in chunks, stream to transcription API via WebSocket for real-time transcription

**When to use:** For live meeting transcription with speaker diarization

**Trade-offs:**
- **Pro:** Sub-500ms latency for natural conversation feel
- **Pro:** Progressive transcription (user sees results immediately)
- **Con:** Complex error handling (reconnection, chunk ordering)
- **Con:** Higher battery usage than batch processing

**Example:**
```typescript
// services/audio/streamingRecorder.ts
export class StreamingRecorder {
  private ws: WebSocket;
  private recording: Audio.Recording;

  async start() {
    // Connect WebSocket to transcription service
    this.ws = new WebSocket('wss://api.transcription.com/v1/stream');

    // Configure audio: 16kHz PCM16, 100ms chunks
    this.recording = new Audio.Recording();
    await this.recording.prepareToRecordAsync({
      isMeteringEnabled: true,
      android: {
        extension: '.wav',
        outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_PCM_16BIT,
        audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_PCM_16BIT,
        sampleRate: 16000,
      },
      ios: {
        extension: '.wav',
        audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 128000,
        linearPCMBitDepth: 16,
      },
    });

    // Stream chunks every 100ms
    this.recording.setOnRecordingStatusUpdate((status) => {
      if (status.isRecording && status.durationMillis % 100 === 0) {
        this.sendChunk();
      }
    });

    await this.recording.startAsync();
  }

  private async sendChunk() {
    const chunk = await this.recording.getChunk(); // Platform-specific
    this.ws.send(chunk);
  }
}
```

### Pattern 5: CRDT-Based Sync with Conflict-Free Merge

**What:** Use Conflict-free Replicated Data Types (Yjs, Automerge) for automatic conflict resolution during sync

**When to use:** When multiple devices edit the same notes offline and need to merge changes

**Trade-offs:**
- **Pro:** Mathematically guaranteed conflict-free merge
- **Pro:** No user intervention needed for conflicts
- **Con:** CRDTs have overhead (larger payload sizes)
- **Con:** Limited to supported data types (text, maps, arrays)
- **Con:** Complex to implement correctly

**Example:**
```typescript
// services/sync/crdtSync.ts
import * as Y from 'yjs';

export class CRDTNoteSync {
  private ydoc: Y.Doc;

  constructor() {
    this.ydoc = new Y.Doc();
  }

  updateNoteContent(noteId: string, content: string) {
    const ytext = this.ydoc.getText(noteId);
    // CRDT handles merging automatically
    ytext.delete(0, ytext.length);
    ytext.insert(0, content);
  }

  async sync() {
    // Encode local changes
    const stateVector = Y.encodeStateVector(this.ydoc);

    // Get remote updates
    const remoteUpdates = await api.getUpdates(stateVector);

    // Apply remote changes (conflict-free)
    Y.applyUpdate(this.ydoc, remoteUpdates);

    // Send local changes
    const localUpdates = Y.encodeStateAsUpdate(this.ydoc);
    await api.sendUpdates(localUpdates);
  }
}
```

## Data Flow

### Write Flow (Create/Update Note)

```
[User Types in Editor]
    ↓
[Component State Updates] (React state for UI responsiveness)
    ↓
[Debounced Save Triggered] (after 500ms pause)
    ↓
[Note Service: updateNote()]
    ↓
┌───────────────────────────────────┐
│ 1. SQLite: Update local DB        │ (Immediate)
│ 2. State Store: Update reactive   │ (Immediate)
│ 3. Sync Queue: Enqueue operation  │ (Async)
└───────────────────────────────────┘
    ↓
[Background Sync Worker]
    ↓
[Cloud API: POST /notes/:id] (When online)
    ↓
[Conflict Resolution] (If remote changed)
    ↓
[Update Local if Remote Wins]
```

### Read Flow (Load Notes)

```
[Screen Renders]
    ↓
[useNotes() Hook]
    ↓
[State Store: Subscribe to notes$]
    ↓
[Note Service: loadNotes()]
    ↓
[SQLite: SELECT * FROM notes] (Local-first)
    ↓
[State Store: Update notes state]
    ↓
[Components Re-render] (Reactive)
    ↓
[Background Sync: Fetch remote updates] (Async, non-blocking)
    ↓
[If Remote Newer: Update local + state]
```

### Audio Transcription Flow

```
[User Starts Recording]
    ↓
[Audio Service: startRecording()]
    ↓
┌──────────────────────────────────────────────────┐
│ 1. expo-audio: Start recording                  │
│ 2. WebSocket: Connect to transcription API      │
│ 3. Timer: Send 100ms audio chunks               │
└──────────────────────────────────────────────────┘
    ↓
[Transcription API Processing]
    ↓
┌──────────────────────────────────────────────────┐
│ - ASR: Audio → Text                              │
│ - Diarization: Identify speakers                │
│ - Timestamps: Word-level timing                  │
└──────────────────────────────────────────────────┘
    ↓
[WebSocket: Receive transcript chunks]
    ↓
[Meeting Store: Append transcript segment]
    ↓
[UI: Display live transcript] (< 500ms latency)
    ↓
[User Stops Recording]
    ↓
[Audio Service: stopRecording()]
    ↓
┌──────────────────────────────────────────────────┐
│ 1. Save audio file to File System               │
│ 2. Save final transcript to SQLite              │
│ 3. Create note from transcript                  │
│ 4. Queue sync to cloud                          │
└──────────────────────────────────────────────────┘
```

### AI Agent Search/Write Flow

```
[User: "Find all notes about X"]
    ↓
[AI Agent Service: processQuery()]
    ↓
┌──────────────────────────────────────────────────┐
│ 1. Parse intent (search vs write vs summarize)  │
│ 2. Query SQLite for relevant notes              │
│ 3. Build context from notes                     │
│ 4. Send to LLM API with system prompt           │
└──────────────────────────────────────────────────┘
    ↓
[LLM API: Generate response]
    ↓
[AI Agent: Parse LLM response]
    ↓
┌──────────────────────────────────────────────────┐
│ If SEARCH: Return filtered notes                │
│ If WRITE: Create new note with generated text   │
│ If SUMMARIZE: Show summary in UI                │
└──────────────────────────────────────────────────┘
    ↓
[Update UI with results]
```

### Calendar Integration Flow

```
[App Launch]
    ↓
[Calendar Service: requestPermissions()]
    ↓
[expo-calendar: getCalendarsAsync()]
    ↓
[Calendar Store: Load upcoming meetings]
    ↓
[Display Calendar View]
    ↓
[User Selects Meeting]
    ↓
[Create Note linked to Calendar Event]
    ↓
┌──────────────────────────────────────────────────┐
│ Note metadata:                                   │
│ - calendarEventId                                │
│ - meetingTitle                                   │
│ - startTime, endTime                             │
│ - attendees                                      │
└──────────────────────────────────────────────────┘
```

### Key Data Flows

1. **User-driven updates:** User action → Local DB (immediate) → UI update (reactive) → Cloud sync (async)
2. **Background sync:** Periodic cloud fetch → Conflict check → Local update if needed → UI re-render
3. **Real-time transcription:** Audio chunk → WebSocket → Transcription → UI update (streaming)
4. **AI agent interaction:** User query → Local context → LLM API → Action execution

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Monolith is fine. Single cloud function for sync. SQLite local DB. MMKV cache. No CRDT needed (last-write-wins). |
| 1k-100k users | Add CDN for audio files. Optimize SQLite queries (indexes on folders, dates). Consider read replicas for cloud DB. Implement CRDT for multi-device users. Add Redis for sync job queue. |
| 100k+ users | Microservices: Separate transcription service, AI service, sync service. Horizontal scaling of API servers. Object storage (S3) for audio. PostgreSQL with partitioning. Real-time sync via WebSocket pools. |

### Scaling Priorities

1. **First bottleneck:** Audio file storage (users record lots of meetings)
   - **Solution:** Stream directly to cloud object storage (S3/R2) instead of saving locally first
   - **Alternative:** Compress audio aggressively (Opus codec can reduce size 80%)

2. **Second bottleneck:** Transcription API costs (expensive at scale)
   - **Solution:** Batch processing instead of real-time for non-critical meetings
   - **Alternative:** On-device transcription with Whisper for basic tier users

3. **Third bottleneck:** Sync conflicts increase with multi-device users
   - **Solution:** Implement CRDT (Yjs) for automatic conflict resolution
   - **Alternative:** Operational Transform (OT) if CRDTs too complex

4. **Fourth bottleneck:** SQLite performance on large note collections (10k+ notes)
   - **Solution:** Archive old notes to separate DB file, load on-demand
   - **Alternative:** Migrate to on-device PostgreSQL (Turso) with better query optimization

## Anti-Patterns

### Anti-Pattern 1: Cloud-First Data Architecture

**What people do:** Save to cloud API first, then update local cache

**Why it's wrong:**
- App unusable offline
- Perceived lag on every action (network round-trip)
- Poor UX when connectivity is flaky
- Violates local-first principles

**Do this instead:**
- Always write to local SQLite first
- Update UI immediately via reactive state
- Sync to cloud asynchronously in background
- Handle conflicts on sync, not on write

### Anti-Pattern 2: Storing Audio as Base64 in SQLite

**What people do:** Convert audio files to base64 strings and store in database

**Why it's wrong:**
- Bloats database size massively (33% overhead from base64)
- Slows down all queries (larger DB file)
- Increases memory usage when loading
- Makes incremental sync impossible

**Do this instead:**
- Store audio files in File System (expo-file-system)
- Store only file path in SQLite
- Separate metadata (transcript, speakers) from binary data
- Stream large files directly to cloud storage

### Anti-Pattern 3: Synchronous Transcription API Calls

**What people do:** Wait for entire transcription to complete before updating UI

**Why it's wrong:**
- Long wait time (30s for 5min audio)
- Blocks UI, poor UX
- Higher API timeout risk
- Misses opportunity for progressive updates

**Do this instead:**
- Use WebSocket streaming transcription
- Update UI incrementally as chunks arrive
- Show loading skeleton with partial results
- Allow user to edit while transcription completes

### Anti-Pattern 4: Loading All Notes Into Memory

**What people do:** `SELECT * FROM notes` and hold entire collection in state

**Why it's wrong:**
- Memory grows unbounded with note count
- Slow initial load time
- Unnecessary re-renders when any note changes
- Doesn't scale past ~1000 notes

**Do this instead:**
- Paginated queries (load 50 notes at a time)
- Virtual scrolling (react-native-flash-list)
- Granular state updates (update only changed note)
- Lazy load note content (load list metadata, fetch content on open)

### Anti-Pattern 5: Rebuilding Markdown Parser on Every Keystroke

**What people do:** Parse full markdown content to React components on every onChange

**Why it's wrong:**
- Heavy CPU usage during typing
- Causes input lag
- Battery drain on mobile
- Unnecessary when user is still typing

**Do this instead:**
- Debounce parsing (wait 300ms after last keystroke)
- Use live markdown with syntax highlighting (react-native-live-markdown)
- Parse only visible portion (viewport-based rendering)
- Consider WebView approach for complex markdown if native parsing too slow

### Anti-Pattern 6: Mixing UI and Business Logic in Components

**What people do:** Put database calls, API calls, and sync logic directly in React components

**Why it's wrong:**
- Impossible to test without rendering components
- Logic not reusable across screens
- Violates separation of concerns
- Makes refactoring painful

**Do this instead:**
- Extract business logic to service layer
- Components only handle UI rendering and user events
- Use hooks to inject services into components
- Test services independently of React

### Anti-Pattern 7: No Conflict Resolution Strategy

**What people do:** Assume sync conflicts won't happen, overwrite remote data blindly

**Why it's wrong:**
- Users lose data when editing same note on multiple devices
- No way to recover from conflicts
- Breaks multi-device workflows
- Leads to angry users and bad reviews

**Do this instead:**
- Implement conflict detection (compare timestamps)
- Use CRDT for automatic merge (Yjs for text)
- Or provide conflict UI (show both versions, let user choose)
- Document sync behavior clearly to users

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| AssemblyAI / Deepgram | WebSocket for real-time, REST for batch | Real-time: 16kHz PCM16 audio chunks. Batch: Upload full file. Both support speaker diarization. |
| OpenAI / Anthropic | REST API with streaming | Use streaming for chat-like AI interactions. Include note context in system prompt. Implement rate limiting. |
| Expo Calendar | Native API via expo-calendar | Request permissions on first use. Works with device calendars (Google, iCloud, Exchange). |
| Cloud Sync (Supabase/Firebase) | REST + WebSocket for real-time | Use optimistic updates. Implement retry queue for failed syncs. Handle 409 conflicts. |
| Object Storage (S3/R2) | Presigned URLs for upload | Generate presigned URL on client, upload directly from device to avoid API bottleneck. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| UI ↔ State Store | Subscribe/dispatch | Components subscribe to reactive state. Zustand/Legend-State provides automatic re-renders. |
| State Store ↔ Services | Function calls | Services update state via store actions. State remains single source of truth. |
| Services ↔ Database | SQL queries | Services abstract DB layer. Use prepared statements for performance. |
| Services ↔ External APIs | HTTP/WebSocket | Centralize API clients in lib/api. Handle errors and retries in service layer. |
| Sync Engine ↔ Conflict Resolver | Function calls | Sync engine detects conflicts, resolver merges changes via CRDT or custom logic. |
| Audio Service ↔ Transcription API | WebSocket streaming | Maintain persistent connection during recording. Handle reconnection gracefully. |

## Build Order Recommendations

Based on component dependencies, recommended implementation order:

### Phase 1: Foundation (No Dependencies)
1. **Database schema + migrations** - Everything depends on this
2. **File system structure** - Needed for audio and markdown storage
3. **Basic state management** - Core of the app
4. **MMKV cache setup** - Simple, no dependencies

### Phase 2: Core Note-Taking (Depends on Phase 1)
5. **Note service** - CRUD operations over SQLite
6. **Folder management** - Hierarchical organization
7. **Note list UI** - Display notes from DB
8. **Basic markdown editor** - Text editing without live preview
9. **Navigation** - Expo Router setup

### Phase 3: Enhanced Editor (Depends on Phase 2)
10. **Live markdown rendering** - Upgrade editor UX
11. **Search functionality** - Query notes from DB
12. **Note linking** - Internal hyperlinks between notes

### Phase 4: Audio Transcription (Depends on Phase 1, 2)
13. **Audio recording service** - expo-audio setup
14. **Audio playback** - Listen to recordings
15. **Transcription API integration** - WebSocket client
16. **Meeting recorder UI** - Capture screen
17. **Speaker diarization display** - Show who said what

### Phase 5: Calendar Integration (Depends on Phase 2, 4)
18. **Calendar permissions** - expo-calendar setup
19. **Calendar view** - Display upcoming meetings
20. **Meeting-note linking** - Associate notes with calendar events

### Phase 6: Cloud Sync (Depends on Phase 2, critical path)
21. **Sync queue** - Track pending operations
22. **Conflict detection** - Compare timestamps
23. **Conflict resolution** - CRDT or merge strategy
24. **Background sync worker** - Periodic sync job
25. **Sync UI indicators** - Show sync status

### Phase 7: AI Agent (Depends on Phase 2, 6)
26. **AI service** - LLM API client
27. **Context building** - Extract relevant notes for prompts
28. **Search agent** - Natural language note search
29. **Writing agent** - Generate note content
30. **Summarization agent** - Condense meeting notes

### Critical Path
The longest dependency chain is:
1. Database → 2. Note Service → 3. Cloud Sync → 4. AI Agent

Audio/Calendar can be built in parallel to Sync/AI, allowing for parallel workstreams.

## Sources

### Architecture & Patterns
- [Expo Local-First Architecture](https://docs.expo.dev/guides/local-first/) (HIGH confidence)
- [React Native New Architecture Overview](https://reactnative.dev/architecture/overview) (HIGH confidence)
- [Building Offline-First React Native Apps: The Complete Guide (2026)](https://javascript.plainenglish.io/building-offline-first-react-native-apps-the-complete-guide-2026-68ff77c7bb06) (MEDIUM confidence)
- [Implement Local-First Architecture with React Native & RxDB](https://dev.family/blog/article/how-to-build-local-first-apps-with-react-native-rxdb-architecture-and-examples) (MEDIUM confidence)
- [The Architecture Shift: Why I'm Betting on Local-First in 2026](https://dev.to/the_nortern_dev/the-architecture-shift-why-im-betting-on-local-first-in-2026-1nh6) (MEDIUM confidence)

### React Native & Expo Best Practices
- [Expo's New Architecture - Documentation](https://docs.expo.dev/guides/new-architecture/) (HIGH confidence)
- [25 React Native Best Practices for High Performance Apps 2026](https://www.esparkinfo.com/blog/react-native-best-practices) (MEDIUM confidence)
- [Expo MVVM Template: A Scalable Architecture](https://www.bitcot.com/expo-mvvm-template-react-native/) (MEDIUM confidence)
- [2026 Paradigm Shift: React Native Architecture Developments](https://instamobile.io/blog/react-native-paradigm-shift/) (MEDIUM confidence)

### Audio & Transcription
- [Expo Audio Documentation](https://docs.expo.dev/versions/latest/sdk/audio/) (HIGH confidence)
- [Top APIs for Real-Time Speech Recognition 2026](https://www.assemblyai.com/blog/best-api-models-for-real-time-speech-recognition-and-transcription) (MEDIUM confidence)
- [Real-Time Audio Transcription Architecture](https://www.gladia.io/blog/real-time-transcription-powered-by-whisper-asr) (MEDIUM confidence)
- [All About Transcription for Real-Time Audio Streaming](https://deepgram.com/learn/all-about-transcription-for-real-time-audio-streaming) (MEDIUM confidence)

### Speaker Diarization
- [What is Speaker Diarization and How Does It Work? (2026 Guide)](https://www.assemblyai.com/blog/what-is-speaker-diarization-and-how-does-it-work) (MEDIUM confidence)
- [Top 8 Speaker Diarization Libraries and APIs 2025](https://www.assemblyai.com/blog/top-speaker-diarization-libraries-and-apis) (MEDIUM confidence)
- [Best Speaker Diarization Models Compared [2026]](https://brasstranscripts.com/blog/speaker-diarization-models-comparison) (MEDIUM confidence)

### CRDT & Sync
- [Syncing All the Things with CRDTs: Local First Development](https://dev.to/charlietap/synking-all-the-things-with-crdts-local-first-development-3241) (MEDIUM confidence)
- [Why Local-First Software Is the Future](https://rxdb.info/articles/local-first-future.html) (MEDIUM confidence)
- [Understanding Real-Time Collaboration with CRDTs](https://shambhavishandilya.medium.com/understanding-real-time-collaboration-with-crdts-e764eb65024e) (MEDIUM confidence)

### Calendar Integration
- [Expo Calendar Documentation](https://docs.expo.dev/versions/latest/sdk/calendar/) (HIGH confidence)
- [Integrating Calendar Events in React Native](https://dev.to/amitkumar13/integrating-calendar-events-in-a-react-native-app-5fgf) (MEDIUM confidence)
- [10 Best Calendar Components For React & React Native (2026)](https://reactscript.com/top-10-calendar-components-react-react-native/) (MEDIUM confidence)

### AI Agent Integration
- [MCP Gateways: A Developer's Guide to AI Agent Architecture in 2026](https://composio.dev/blog/mcp-gateways-guide) (MEDIUM confidence)
- [How AI Is Redesigning Android App Architecture in 2026](https://gdgcmet.medium.com/how-ai-is-quietly-redesigning-android-app-architecture-in-2026-4224d5849e78) (MEDIUM confidence)
- [Mobile Apps in 2026: How AI Agents Are Replacing Traditional Interfaces](https://vocal.media/journal/mobile-apps-in-2026-how-ai-agents-are-replacing-traditional-interfaces) (MEDIUM confidence)

### Markdown Editing
- [Edit Rich Text - Expo Documentation](https://docs.expo.dev/guides/editing-richtext/) (HIGH confidence)
- [Expensify react-native-live-markdown](https://github.com/Expensify/react-native-live-markdown) (MEDIUM confidence)
- [5 Best Markdown Editors for React Compared](https://strapi.io/blog/top-5-markdown-editors-for-react) (MEDIUM confidence)

---
*Architecture research for: K7Notes AI-powered note-taking app*
*Researched: 2026-01-31*
