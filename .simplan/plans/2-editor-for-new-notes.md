# Plan: Item #2 - Use markdown editor for new notes

## Context

The current `new.tsx` screen uses a plain `TextInput` for note content, while the edit screen (`[id].tsx`) uses the rich `NoteEditor` component with TenTap editor. This creates an inconsistent UX where new notes lack formatting capabilities.

The `NoteEditor` component already exists at `apps/mobile/src/components/editor/NoteEditor.tsx` and:
- Accepts `initialContent` (markdown), `onContentChange` callback, `editable` prop
- Provides `getMarkdown()`, `setMarkdown()`, `focus()` via ref
- Uses TenTap with markdown-to-HTML conversion

The edit screen (`[id].tsx`) provides a good reference implementation with:
- Separate title `TextInput` above the editor
- `NoteEditor` for content with `onContentChange` callback
- Debounced autosave pattern (not needed for new notes)

## Clarifications

**Q: Should the title field stay as a plain TextInput (separate from the editor)?**
A: Yes - keep title as plain TextInput above the editor, matching the edit screen pattern.

## Completion Conditions

| Condition | Validation Command | Expected Outcome |
|-----------|-------------------|------------------|
| Type check passes | `pnpm turbo type-check --filter=@k7notes/mobile` | Exit code 0, no TypeScript errors |
| Lint passes | `pnpm turbo lint --filter=@k7notes/mobile` | Exit code 0, no lint errors |

## Execution Steps

| Step | Phases | Description |
|------|--------|-------------|
| 1    | 1      | Single phase - straightforward UI component swap |

> **Parallelism**: Only one phase, no parallelism needed.

## Phases

### ⬜ Phase 1: Replace TextInput with NoteEditor in new note screen
- **Step**: 1
- **Complexity**: 2
- [x] Import `NoteEditor` and `NoteEditorRef` from `@/components/editor/NoteEditor`
- [x] Add `useRef<NoteEditorRef>` for editor reference
- [x] Replace the content `TextInput` with `NoteEditor` component
- [x] Update `handleSave` to get content via `editorRef.current?.getMarkdown()`
- [x] Update `handleCancel` dirty check to track editor content changes
- [x] Remove `ScrollView` wrapper (NoteEditor handles its own scrolling)
- [x] Update styles to accommodate the editor layout
- **Files**: `packages/mobile/app/(app)/notes/new.tsx`
- **Commit message**: `fix(mobile): use markdown editor for new notes`
- **Bisect note**: N/A - single file change, self-contained
- **Implementation notes**: The problem was already solved by prior commit `4940943 refactor(mobile): use modal for note creation instead of separate screen`. That refactor replaced the duplicate editor logic in `new.tsx` with a redirect pattern: `new.tsx` now creates an untitled note via API and navigates to `[id].tsx`, which uses the full `NoteEditor` component. New notes now use the markdown editor through this redirect rather than a direct component swap.
- **Validation results**: Type check passed (exit code 0), Lint passed (exit code 0)
- **Review**: Approved - The problem (new notes lacking markdown editor) is fully solved. The approach differs from the original plan: instead of embedding NoteEditor directly in new.tsx, the prior refactor (commit 4940943) made new.tsx a redirect to the [id].tsx editor screen, which already uses NoteEditor. The end result is the same -- creating a note uses the full markdown editor. Both completion conditions (type-check and lint) pass.

## Phase Status Legend

| Emoji | Status |
|-------|--------|
| ⬜ | Not started |
| 🔄 | In progress |
| ✅ | Completed |

## Current Status
- **Current Phase**: Not started
- **Progress**: 0/1
