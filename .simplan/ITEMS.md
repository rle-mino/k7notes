# Backlog

## Item #1: Remove note
- **Type**: ✨ Feature
- **Status**: ✅ DONE
- **Description**: Add ability to delete a note from the note detail/edit screen
- **Slug**: remove-note
- **Plan**: `.simplan/plans/1-remove-note.md`

## Item #2: Use markdown editor for new notes
- **Type**: 🐛 Fix
- **Status**: ✅ DONE
- **Description**: Creating a note should use the markdown editor instead of a plain text area
- **Slug**: editor-for-new-notes
- **Plan**: `.simplan/plans/2-editor-for-new-notes.md`

## Item #3: Fullstack tests with Playwright
- **Type**: ✨ Feature
- **Status**: 🔄 IN_PROGRESS
- **Description**: Set up Playwright for full-stack e2e tests covering user flows
- **Slug**: fullstack-tests-playwright
- **Plan**: `.simplan/plans/3-fullstack-tests-playwright.md`

## Item #4: Pre-commit hook to protect against regression
- **Type**: ✨ Feature
- **Status**: 📝 PLANNED
- **Description**: Add a pre-commit hook that runs tests before each commit to catch regressions early
- **Slug**: precommit-hook-tests
- **Plan**: `.simplan/plans/4-precommit-hook-tests.md`

## Item #5: Remove console clear on NestJS server start
- **Type**: 🐛 Fix
- **Status**: 📋 BACKLOG
- **Description**: Remove the console clear that happens when starting the NestJS server
- **Slug**: remove-nestjs-clear
- **Plan**: None

## Item #6: Default notes structure on account creation
- **Type**: ✨ Feature
- **Status**: 📋 BACKLOG
- **Description**: Automatically create a default folder structure (daily, people, projects, etc.) when a new user account is created
- **Slug**: default-notes-structure
- **Plan**: None

## Item #7: Audio recording storage and transcription list
- **Type**: ✨ Feature
- **Status**: 📋 BACKLOG
- **Description**: Store audio recordings on-device and list them in a dedicated audio/transcription screen (replacing the "recents" menu). Audio files should be listed with their transcriptions. The current behavior of writing transcriptions directly into notes is incorrect — only detailed summaries should go into notes (to be implemented later).
- **Slug**: audio-storage-transcription
- **Plan**: None
