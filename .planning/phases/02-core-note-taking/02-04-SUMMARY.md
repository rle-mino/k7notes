---
phase: 02-core-note-taking
plan: 04
subsystem: editor
tags: [10tap-editor, wysiwyg, markdown, turndown, showdown, react-native-webview]

# Dependency graph
requires:
  - phase: 02-02
    provides: CRUD operations for notes (content storage)
provides:
  - NoteEditor component with WYSIWYG rich text editing
  - markdownToHtml for loading note content into editor
  - htmlToMarkdown for saving editor content as markdown
  - isContentEmpty utility for empty state detection
affects: [02-05, 02-06]

# Tech tracking
tech-stack:
  added:
    - "@10play/tentap-editor@1.0.1"
    - "react-native-webview@13.16.0"
    - "turndown@7.2.2"
    - "showdown@2.1.0"
  patterns:
    - "WYSIWYG with markdown storage (convert on load/save)"
    - "forwardRef with useImperativeHandle for component API"
    - "10tap-editor CoreBridge.configureCSS for styling"

key-files:
  created:
    - apps/mobile/src/utils/markdown.ts
    - apps/mobile/src/utils/index.ts
    - apps/mobile/src/components/editor/NoteEditor.tsx
    - apps/mobile/src/components/editor/index.ts
  modified:
    - apps/mobile/package.json

key-decisions:
  - "10tap-editor for WYSIWYG - Tiptap/Prosemirror based, renders in WebView"
  - "Showdown for md-to-HTML (loading), Turndown for HTML-to-md (saving)"
  - "Built-in Toolbar used initially - custom EditorToolbar.tsx can be added later"
  - "_subscribeToContentUpdate for change tracking (internal API)"

patterns-established:
  - "NoteEditorRef interface for imperative control (getMarkdown, setMarkdown, focus)"
  - "Markdown stored as source of truth, HTML only for display"
  - "KeyboardAvoidingView with iOS-specific offset for keyboard handling"

# Metrics
duration: 2min
completed: 2026-01-31
---

# Phase 02 Plan 04: Note Editor Component Summary

**10tap-editor WYSIWYG wrapper with bidirectional markdown conversion for portable note storage.**

## What Was Built

### 1. Markdown Conversion Utilities

Created `apps/mobile/src/utils/markdown.ts` with bidirectional conversion:

```typescript
// Load: markdown -> HTML for display
export function markdownToHtml(markdown: string): string

// Save: HTML -> markdown for storage
export function htmlToMarkdown(html: string): string

// Helper: check empty editor states
export function isContentEmpty(html: string | null | undefined): boolean
```

Configuration:
- **Showdown** (md -> HTML): tables, tasklists, strikethrough, code blocks, emoji
- **Turndown** (HTML -> md): atx headings (#), fenced code, dash bullet lists

### 2. NoteEditor Component

Created `apps/mobile/src/components/editor/NoteEditor.tsx`:

```typescript
// Component props
interface NoteEditorProps {
  initialContent?: string;  // Markdown content
  onContentChange?: (markdown: string) => void;
  editable?: boolean;
}

// Imperative API via ref
interface NoteEditorRef {
  getMarkdown: () => Promise<string>;
  setMarkdown: (markdown: string) => void;
  focus: () => void;
}
```

Features:
- **10tap-editor** integration via `useEditorBridge`
- **TenTapStartKit** extensions (bold, italic, headers, lists, code, links, blockquote)
- **Built-in Toolbar** for formatting options
- **Custom CSS** for consistent rendering across platforms
- **iOS keyboard avoidance** with `KeyboardAvoidingView`

## Architecture Decision

**Why WYSIWYG with markdown storage?**

| Storage Format | Display Format | Why |
|----------------|----------------|-----|
| Markdown | Rich text | Best of both worlds |

- **Users see**: Formatted text (headers, bold, lists) - like Google Docs
- **Data stores as**: Markdown - portable, git-friendly, searchable, convertible
- **Conversion**: Transparent on load/save, no user awareness needed

## Dependencies Added

| Package | Version | Purpose |
|---------|---------|---------|
| @10play/tentap-editor | 1.0.1 | WYSIWYG editor (Tiptap/Prosemirror in WebView) |
| react-native-webview | 13.16.0 | Peer dependency for 10tap-editor |
| showdown | 2.1.0 | Markdown to HTML conversion |
| turndown | 7.2.2 | HTML to Markdown conversion |

## Commits

| Hash | Type | Description |
|------|------|-------------|
| d61e07a | chore | Install 10tap-editor and markdown conversion dependencies |
| de101b2 | feat | Create markdown conversion utilities |
| 3df80ac | feat | Create NoteEditor component with 10tap-editor |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript filter type cast for Turndown**
- **Found during:** Task 2
- **Issue:** `'strike'` not in `keyof HTMLElementTagNameMap`
- **Fix:** Added type cast `as (keyof HTMLElementTagNameMap)[]`
- **Files:** apps/mobile/src/utils/markdown.ts

**2. [Rule 3 - Blocking] 10tap-editor API change**
- **Found during:** Task 3
- **Issue:** `subscribeToContentUpdate` is actually `_subscribeToContentUpdate` (internal API)
- **Fix:** Updated to use underscore-prefixed method name
- **Files:** apps/mobile/src/components/editor/NoteEditor.tsx

## Verification Results

- [x] `pnpm --filter @k7notes/mobile type-check` passes
- [x] All packages installed: @10play/tentap-editor, react-native-webview, turndown, showdown
- [x] NoteEditor component exports correctly via index.ts
- [x] markdownToHtml and htmlToMarkdown functions typed and working

## Next Phase Readiness

**Ready for 02-05 (Note UI):**
- NoteEditor component available at `@/components/editor`
- Can import: `import { NoteEditor, NoteEditorRef } from '@/components/editor'`
- Use ref to get/set markdown content
- Content changes reported via `onContentChange` callback

**Integration pattern:**
```tsx
const editorRef = useRef<NoteEditorRef>(null);

// Load note
editorRef.current?.setMarkdown(note.content);

// Save note (debounced)
const handleChange = (markdown: string) => {
  updateNote({ id: note.id, content: markdown });
};

<NoteEditor
  ref={editorRef}
  initialContent={note.content}
  onContentChange={handleChange}
/>
```
