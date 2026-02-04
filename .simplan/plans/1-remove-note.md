# Plan: Item #1 - Remove note

## Context
- The backend already has a fully implemented `delete` endpoint in the notes contract (`DELETE /api/notes/{id}`)
- The `NotesService.delete()` method verifies ownership before deleting
- The mobile app's note edit screen is at `apps/mobile/app/(app)/notes/[id].tsx`
- The screen has a header with back button (left) and save indicator (right)
- The app uses `Alert.alert()` for confirmation dialogs (pattern seen in "Discard Note?" and "Sign Out" flows)
- The oRPC client is set up at `apps/mobile/src/lib/orpc.ts` and already exposes `orpc.notes.delete()`

## Clarifications
| Question | Answer |
|----------|--------|
| Button location | Header right, alongside save indicator |
| Post-delete navigation | Go back to previous screen |
| Confirmation | Yes, show Alert.alert confirmation |
| Button style | Trash icon only (minimal) |

## Completion Conditions

| Condition | Validation Command | Expected Outcome |
|-----------|-------------------|------------------|
| Type check passes | `pnpm type-check` | Exit code 0, no TypeScript errors |
| Lint passes | `pnpm lint` | Exit code 0, no linting errors |

## Execution Steps

| Step | Phases | Description |
|------|--------|-------------|
| 1    | 1      | Single atomic change: add delete functionality to note edit screen |

> **Parallelism**: Only 1 phase, no parallelization needed.

## Phases

### ✅ Phase 1: Add delete button to note edit screen
- **Step**: 1
- **Complexity**: 2
- [x] Import any needed icons (use emoji 🗑️ for cross-platform compatibility)
- [x] Add `deleting` state to track deletion in progress
- [x] Create `handleDelete` function that:
  - Shows confirmation Alert with "Delete Note?" title
  - On confirm: calls `orpc.notes.delete({ id })`, then `router.back()`
  - Handles errors with Alert.alert
- [x] Add delete button (TouchableOpacity with trash icon) to `headerRight` in Stack.Screen options
  - Position it before the save indicator
  - Disable during saving or deleting states
  - Style with red color to indicate destructive action
- [x] Add styles for delete button
- **Files**: `apps/mobile/app/(app)/notes/[id].tsx`
- **Commit message**: `feat(mobile): add delete button to note edit screen`
- **Bisect note**: N/A - single file change, self-contained
- **Implementation notes**: Added `deleting` state and `handleDelete` callback. The delete button uses a trash emoji (🗑️) for cross-platform compatibility. Button shows ActivityIndicator when deleting, and is disabled during saving or deleting states. Added `gap: 12` to headerRight for spacing between delete button and save indicator. The handleDelete function cancels any pending autosave and clears pending changes before deletion to prevent the unmount effect from trying to save a deleted note.
- **Validation results**: `pnpm type-check` passed (exit 0), `pnpm lint` passed (exit 0)
- **Review**: Approved - Implementation correctly adds delete button to header with confirmation dialog, calls API, navigates back on success. Good attention to detail: cancels pending autosaves before deletion to prevent race conditions, proper error handling with user-friendly messages, and appropriate disabled states during operations.

## Phase Status Legend

| Emoji | Status |
|-------|--------|
| ⬜ | Not started |
| 🔄 | In progress |
| ✅ | Completed |

## Current Status
- **Current Phase**: All phases complete
- **Progress**: 1/1
