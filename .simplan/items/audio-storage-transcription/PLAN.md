# Plan: Audio recording storage and transcription list

## Context

The codebase already has a full audio recording + transcription pipeline:
- **Mobile**: `AudioRecordingModal` records via `expo-audio`, converts to base64, sends to API
- **Backend**: `transcriptions.service.ts` uses OpenAI Whisper (`gpt-4o-transcribe-diarize`), stores transcription text/segments in `transcriptions` table
- **Current flow**: Record → Transcribe → Create note with transcription content → Link transcription to note → Navigate to note

**Problem**: Audio files are discarded after transcription. Transcriptions are written directly into notes, which is incorrect — only summaries should go into notes (future work).

**Solution**: Store audio files on-device in `documentDirectory`, show them in a virtual "Audio" folder at the top of the notes tree. Each recording appears as a custom card with: editable title, date, duration, inline playback, transcription preview, and a "Transcribe" button for un-transcribed recordings.

**Key existing files**:
- `packages/mobile/src/components/audio/AudioRecordingModal.tsx` — recording UI
- `packages/mobile/src/hooks/useTreeData.ts` — tree data structure for notes list
- `packages/mobile/src/components/notes/TreeItem.tsx` — renders tree items
- `packages/api/src/transcriptions/` — backend transcription service
- `packages/contracts/src/contracts/transcriptions.ts` — oRPC contract
- `packages/api/src/db/schema.ts` — DB schema with `transcriptions` table

**DB schema note**: The `transcriptions` table already stores: id, userId, provider, text, segments (jsonb), durationSeconds, language, metadata (jsonb), noteId, createdAt. We need to add a `title` field and a new `audioRecordings` table for on-device file metadata tracking.

## Clarifications

1. **Storage**: Audio files stored on-device in `documentDirectory` (persisted across app updates, backed up). No backend upload.
2. **Virtual folder**: "Audio" appears pinned at top of notes tree, before any real folders.
3. **UI inside folder**: Custom audio cards (not tree-style sub-items) with title, date, duration, play/pause, transcription preview.
4. **Recents tab**: Keep as-is, unchanged.
5. **Transcribe action**: Auto-send to API on tap (no confirmation dialog).
6. **Titles**: Default to timestamp format "Recording YYYY-MM-DD HH:MM", user can edit.
7. **Current note-creation behavior**: Stop creating notes from audio transcription. Only store audio + transcription. Summary-to-note is future work.

## Completion Conditions

| Condition | Validation Command | Expected Outcome |
|-----------|-------------------|------------------|
| Type check | `pnpm type-check` | Exit code 0, no errors |
| Lint | `pnpm lint` | Exit code 0, no errors |
| Tests | `pnpm test` | Exit code 0, all tests pass |
| E2E tests | `pnpm turbo e2e --filter=@k7notes/e2e` | All Playwright tests pass |
| QA testing | `/qa` skill | Manual verification of audio recording, storage, playback, transcription, and UI |

## Execution Steps

| Step | Phases | Description |
|------|--------|-------------|
| 1    | 1      | Add `title` column to transcriptions DB schema and local audio storage utility |
| 2    | 2      | Add `recordings.list` contract/endpoint to serve recording metadata to frontend |
| 3    | 3      | Refactor AudioRecordingModal to save audio on-device and stop creating notes |
| 4    | 4      | Build Audio virtual folder in the notes tree with custom audio cards |
| 5    | 5      | Add inline audio playback and transcription trigger from audio cards |
| 6    | 6      | Add title editing for recordings and polish |
| 7    | 7      | Update E2E tests for changed audio flow |

> **Parallelism**: Each phase depends on the prior one, so all steps are sequential.

## Phases

### ⬜ Phase 1: Schema update and local audio storage utility
- **Step**: 1
- **Complexity**: 3
- [ ] Add `title` column (nullable text) to `transcriptions` table in `packages/api/src/db/schema.ts`
- [ ] Run `db:push` to apply schema change
- [ ] Create `packages/mobile/src/lib/audioStorage.ts` utility:
  - `getAudioDir()` → returns `${documentDirectory}audio/`
  - `saveRecording(base64: string, mimeType: string)` → saves file, returns `{ fileUri, fileName }`
  - `listRecordings()` → returns array of `{ fileUri, fileName, createdAt }` from the audio directory
  - `deleteRecording(fileName: string)` → removes file
  - `getRecordingBase64(fileUri: string)` → reads file as base64 for transcription
- [ ] Add platform-specific handling: native uses `expo-file-system`, web uses IndexedDB or blob URLs
- **Files**: `packages/api/src/db/schema.ts`, `packages/mobile/src/lib/audioStorage.ts`, `packages/mobile/src/lib/audioStorage.web.ts`
- **Commit message**: `feat: add title to transcriptions schema and local audio storage utility`
- **Bisect note**: Schema is additive (nullable column), storage utility is new unused code — safe intermediate state.

### ⬜ Phase 2: Backend endpoint for listing recordings with transcription data
- **Step**: 2
- **Complexity**: 3
- [ ] Add `list` route to transcriptions contract in `packages/contracts/src/contracts/transcriptions.ts`:
  - `GET /api/transcriptions` → returns array of transcription records for the authenticated user
  - Response includes: id, title, text, segments, durationSeconds, language, createdAt
- [ ] Add `updateTitle` route to transcriptions contract:
  - `PUT /api/transcriptions/:id/title` → updates transcription title
- [ ] Add schemas for list response and title update in `packages/contracts/src/schemas/transcription.ts`
- [ ] Implement `list()` and `updateTitle()` in `packages/api/src/transcriptions/transcriptions.service.ts`
- [ ] Add controller handlers in `packages/api/src/transcriptions/transcriptions.controller.ts`
- **Files**: `packages/contracts/src/contracts/transcriptions.ts`, `packages/contracts/src/schemas/transcription.ts`, `packages/api/src/transcriptions/transcriptions.service.ts`, `packages/api/src/transcriptions/transcriptions.controller.ts`
- **Commit message**: `feat: add list and updateTitle endpoints for transcriptions`
- **Bisect note**: New endpoints, no callers yet — safe.

### ⬜ Phase 3: Refactor AudioRecordingModal to save audio on-device
- **Step**: 3
- **Complexity**: 4
- [ ] Modify `AudioRecordingModal.tsx` post-recording flow:
  1. Save audio file to `documentDirectory` using `audioStorage.saveRecording()`
  2. Send base64 to transcription API (keep existing transcription flow)
  3. Store the local file name in transcription metadata (so we can link them)
  4. **Stop creating notes** — remove the `orpc.notes.create()` and `orpc.transcriptions.linkToNote()` calls
  5. Set title to `"Recording YYYY-MM-DD HH:MM"` via the new `updateTitle` endpoint (or pass title during transcribe)
  6. After transcription completes, close modal (don't navigate to a note)
- [ ] Update the `transcribe` contract/endpoint to accept an optional `title` field and optional `localFileName` in metadata
- [ ] Handle the case where transcription fails: audio is still saved locally, user can retry transcription later
- **Files**: `packages/mobile/src/components/audio/AudioRecordingModal.tsx`, `packages/contracts/src/contracts/transcriptions.ts`, `packages/contracts/src/schemas/transcription.ts`, `packages/api/src/transcriptions/transcriptions.service.ts`, `packages/api/src/transcriptions/transcriptions.controller.ts`
- **Commit message**: `feat: save audio on-device and stop creating notes from transcriptions`
- **Bisect note**: This changes user-visible behavior (no more auto-created notes). The audio folder UI comes in Phase 4, but recordings are already saved and transcribed. Intermediate state: recordings exist but aren't visible in UI yet — acceptable since the tree hasn't been modified yet.

### ⬜ Phase 4: Audio virtual folder in the notes tree
- **Step**: 4
- **Complexity**: 4
- [ ] Create `packages/mobile/src/hooks/useAudioRecordings.ts` hook:
  - Combines local audio files from `audioStorage.listRecordings()` with transcription metadata from `orpc.transcriptions.list()`
  - Matches files by `localFileName` in transcription metadata
  - Returns unified list: `{ fileUri, fileName, title, transcription?, durationSeconds?, createdAt }`
- [ ] Modify `useTreeData.ts` to inject a virtual "Audio" folder node at the top of the tree:
  - ID: `"__audio__"` (special sentinel)
  - Type: `"audio-folder"` (new TreeItemType)
  - When expanded, shows audio recording items
- [ ] Create `packages/mobile/src/components/audio/AudioCard.tsx` component:
  - Title (editable, with pencil icon)
  - Date and duration metadata
  - Transcription preview text (first ~100 chars) or "Not transcribed" badge
  - Play/pause button placeholder (wired in Phase 5)
  - "Transcribe" button if no transcription exists
- [ ] Add `"audio-folder"` and `"audio-item"` types to `TreeItem.tsx` rendering logic
- [ ] Render AudioCard for `"audio-item"` type nodes
- **Files**: `packages/mobile/src/hooks/useAudioRecordings.ts`, `packages/mobile/src/hooks/useTreeData.ts`, `packages/mobile/src/components/audio/AudioCard.tsx`, `packages/mobile/src/components/notes/TreeItem.tsx`
- **Commit message**: `feat: add virtual Audio folder with recording cards to notes tree`
- **Bisect note**: Playback and transcribe-from-card come in Phase 5, but the folder and cards are visible. Buttons may be placeholders briefly.

### ⬜ Phase 5: Inline audio playback and transcription trigger
- **Step**: 5
- **Complexity**: 4
- [ ] Create `packages/mobile/src/hooks/useAudioPlayer.ts` hook:
  - Uses `expo-audio` playback API
  - Provides: `play(uri)`, `pause()`, `isPlaying`, `progress`, `duration`
  - Handles audio session configuration for playback
- [ ] Wire play/pause button in `AudioCard.tsx`:
  - Show play/pause toggle icon
  - Show simple progress bar (current position / total duration)
  - Only one recording plays at a time (pause others when starting new)
- [ ] Wire "Transcribe" button in `AudioCard.tsx`:
  - Read audio file as base64 via `audioStorage.getRecordingBase64()`
  - Send to `orpc.transcriptions.transcribe()` with title and localFileName
  - Show loading spinner on the card during transcription
  - Refresh card data after transcription completes
- [ ] Handle web platform: use HTML5 Audio API for playback in `useAudioPlayer.web.ts`
- **Files**: `packages/mobile/src/hooks/useAudioPlayer.ts`, `packages/mobile/src/hooks/useAudioPlayer.web.ts`, `packages/mobile/src/components/audio/AudioCard.tsx`
- **Commit message**: `feat: add inline audio playback and transcription trigger`
- **Bisect note**: N/A

### ⬜ Phase 6: Title editing and polish
- **Step**: 6
- **Complexity**: 2
- [ ] Add inline title editing to `AudioCard.tsx`:
  - Tap pencil icon → title becomes editable TextInput
  - On blur or submit → call `orpc.transcriptions.updateTitle()`
  - For un-transcribed recordings, store title locally (update when transcribed)
- [ ] Add pull-to-refresh for the Audio folder contents
- [ ] Handle edge cases: empty state (no recordings), error states, loading states
- [ ] Ensure the "Audio" folder shows correct recording count badge
- **Files**: `packages/mobile/src/components/audio/AudioCard.tsx`, `packages/mobile/src/hooks/useAudioRecordings.ts`
- **Commit message**: `feat: add title editing and polish audio recordings UI`
- **Bisect note**: N/A

### ⬜ Phase 7: Update E2E tests
- **Step**: 7
- **Complexity**: 3
- [ ] Update any existing E2E tests that test the audio recording flow (if they expect note creation)
- [ ] Add E2E test for: record audio → verify it appears in Audio folder
- [ ] Add E2E test for: audio playback controls work
- [ ] Add E2E test for: transcribe button triggers transcription
- [ ] Verify all existing E2E tests still pass with the changed behavior
- **Files**: `packages/e2e/tests/` (specific test files TBD based on existing tests)
- **Commit message**: `test: update E2E tests for audio storage and transcription flow`
- **Bisect note**: N/A

## Phase Status Legend

| Emoji | Status |
|-------|--------|
| ⬜ | Not started |
| 🔄 | In progress |
| ✅ | Completed |

## Current Status
- **Current Phase**: Not started
- **Progress**: 0/7
