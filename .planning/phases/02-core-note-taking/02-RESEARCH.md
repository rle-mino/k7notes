# Phase 2: Core Note-Taking - Research

**Researched:** 2026-01-31
**Domain:** Local-first note-taking with React Native, SQLite, markdown
**Confidence:** HIGH

## Summary

Phase 2 implements core note-taking functionality using a local-first architecture with SQLite database on React Native. The research identified the standard stack for this domain: Expo SQLite with Drizzle ORM for database access, react-native-markdown-display for rendering, and SQLite FTS5 for full-text search. The local-first approach prioritizes offline capability, with all data stored and queried from the device's local SQLite database.

The standard architecture uses an adjacency list model for folder hierarchy (simple parent_id foreign key), FTS5 virtual tables with triggers for instant full-text search, and Drizzle ORM's type-safe queries with live query hooks for reactive UI updates. For markdown editing, a plain TextInput suffices for Phase 2, with markdown rendering in a separate preview view - live markdown editing libraries exist but add complexity better deferred.

The key technical challenges are: configuring Metro bundler to handle .sql migration files, properly setting up FTS5 triggers to keep search indexes synchronized, handling keyboard avoidance for multiline text inputs, and managing database migrations with Drizzle Kit in React Native's constrained environment.

**Primary recommendation:** Use Expo SQLite (~16.0.10) with Drizzle ORM for type-safe database access, adjacency list for folder hierarchy with recursive CTEs, FTS5 external content tables with triggers for search, and react-native-markdown-display for rendering.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-sqlite | ~16.0.10 | SQLite database for React Native | Official Expo solution, supports SQLCipher encryption, change listeners for reactivity, works with Drizzle ORM |
| drizzle-orm | latest | Type-safe ORM with schema and queries | Officially supports Expo SQLite, generates TypeScript types, provides useLiveQuery hook, migration support |
| drizzle-kit | latest (dev) | Migration generation and management | Companion to Drizzle ORM, generates SQL migrations from schema changes |
| react-native-markdown-display | latest | Markdown rendering with native components | 100% CommonMark compatible, uses native RN components (not WebView), customizable styling, code block support |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| babel-plugin-inline-import | latest (dev) | Import .sql files in React Native | Required for Drizzle migrations to work with Metro bundler |
| react-native-keyboard-controller | latest | Advanced keyboard handling | If KeyboardAvoidingView insufficient for multiline markdown editing |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Expo SQLite | op-sqlite (JSI library) | Better performance for large datasets, but more complex setup, less Expo integration |
| react-native-markdown-display | react-native-marked | Has theming and JSX component support, but less mature than markdown-display |
| Adjacency List | Nested Sets or Materialized Path | Better read performance for entire subtrees, but complex inserts/updates |
| Plain TextInput | react-native-live-markdown | Live markdown formatting while typing, but requires Reanimated worklets, more complex |

**Installation:**
```bash
npx expo install expo-sqlite
pnpm add drizzle-orm
pnpm add -D drizzle-kit
pnpm add react-native-markdown-display
pnpm add -D babel-plugin-inline-import
```

## Architecture Patterns

### Recommended Project Structure
```
apps/mobile/
├── app/
│   ├── (app)/              # Authenticated routes
│   │   ├── notes/          # Note-related screens
│   │   │   ├── index.tsx   # Note list (root folder)
│   │   │   ├── [id].tsx    # Note editor (dynamic route)
│   │   │   └── folder/
│   │   │       └── [id].tsx # Folder view
│   │   └── search/
│   │       └── index.tsx   # Search screen
│   └── (auth)/             # Existing auth routes
├── db/
│   ├── schema.ts           # Drizzle schema definitions
│   ├── client.ts           # Database connection & Drizzle client
│   ├── migrations/         # Generated SQL migrations
│   └── queries/            # Reusable query functions
│       ├── notes.ts
│       ├── folders.ts
│       └── search.ts
└── components/
    ├── markdown/
    │   ├── MarkdownRenderer.tsx
    │   └── MarkdownEditor.tsx
    └── notes/
        ├── NoteList.tsx
        ├── NoteCard.tsx
        └── FolderTree.tsx
```

### Pattern 1: Local-First Database with Drizzle

**What:** Initialize SQLite database with Drizzle ORM wrapper and enable change listeners for reactive queries.

**When to use:** At app startup, before rendering main UI.

**Example:**
```typescript
// db/client.ts
// Source: https://orm.drizzle.team/docs/connect-expo-sqlite
import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import * as schema from "./schema";

const expo = openDatabaseSync("k7notes.db", {
  enableChangeListener: true, // Required for useLiveQuery
});

export const db = drizzle(expo, { schema });
```

```typescript
// app/_layout.tsx
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import migrations from "../db/migrations/migrations";

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return <ErrorScreen error={error} />;
  }

  if (!success) {
    return <LoadingScreen />;
  }

  return <Slot />;
}
```

### Pattern 2: Adjacency List for Folder Hierarchy

**What:** Model nested folders using parent_id foreign key, query with recursive CTEs.

**When to use:** For organizing notes in nested folders with unlimited depth.

**Example:**
```typescript
// db/schema.ts
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const folders = sqliteTable("folders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  parentId: integer("parent_id").references(() => folders.id, {
    onDelete: "cascade"
  }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date()),
}, (table) => ({
  parentIdx: index("parent_idx").on(table.parentId),
}));

export const notes = sqliteTable("notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  folderId: integer("folder_id").references(() => folders.id, {
    onDelete: "set null"
  }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date()),
}, (table) => ({
  folderIdx: index("folder_idx").on(table.folderId),
}));
```

```typescript
// db/queries/folders.ts
// Query folder tree with recursive CTE
import { sql } from "drizzle-orm";

export async function getFolderTree(folderId?: number) {
  return db.execute(sql`
    WITH RECURSIVE folder_tree(id, name, parent_id, depth, path) AS (
      SELECT id, name, parent_id, 0 as depth, name as path
      FROM folders
      WHERE ${folderId ? sql`id = ${folderId}` : sql`parent_id IS NULL`}

      UNION ALL

      SELECT f.id, f.name, f.parent_id, ft.depth + 1, ft.path || '/' || f.name
      FROM folders f
      JOIN folder_tree ft ON f.parent_id = ft.id
    )
    SELECT * FROM folder_tree
    ORDER BY path;
  `);
}
```

### Pattern 3: FTS5 External Content Tables with Triggers

**What:** Create FTS5 virtual table referencing notes table, keep synchronized with triggers.

**When to use:** For instant full-text search across all note content.

**Example:**
```sql
-- db/migrations/0001_add_fts.sql
-- Source: https://sqlite.org/fts5.html
-- Create FTS5 virtual table
CREATE VIRTUAL TABLE notes_fts USING fts5(
  title,
  content,
  content=notes,
  content_rowid=id,
  tokenize='porter unicode61'
);

-- Triggers to keep FTS5 in sync
CREATE TRIGGER notes_fts_insert AFTER INSERT ON notes BEGIN
  INSERT INTO notes_fts(rowid, title, content)
  VALUES (new.id, new.title, new.content);
END;

CREATE TRIGGER notes_fts_delete AFTER DELETE ON notes BEGIN
  INSERT INTO notes_fts(notes_fts, rowid, title, content)
  VALUES('delete', old.id, old.title, old.content);
END;

CREATE TRIGGER notes_fts_update AFTER UPDATE ON notes BEGIN
  INSERT INTO notes_fts(notes_fts, rowid, title, content)
  VALUES('delete', old.id, old.title, old.content);
  INSERT INTO notes_fts(rowid, title, content)
  VALUES (new.id, new.title, new.content);
END;
```

```typescript
// db/queries/search.ts
import { sql } from "drizzle-orm";

export async function searchNotes(query: string) {
  return db.execute(sql`
    SELECT
      n.id,
      n.title,
      n.content,
      snippet(notes_fts, 1, '<mark>', '</mark>', '...', 32) as snippet,
      bm25(notes_fts) as rank
    FROM notes_fts
    JOIN notes n ON notes_fts.rowid = n.id
    WHERE notes_fts MATCH ${query}
    ORDER BY rank
    LIMIT 50;
  `);
}
```

### Pattern 4: Live Queries for Reactive UI

**What:** Use Drizzle's useLiveQuery hook to automatically re-render when data changes.

**When to use:** For note lists, folder contents, search results that should update reactively.

**Example:**
```typescript
// components/notes/NoteList.tsx
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { eq } from "drizzle-orm";
import { notes } from "@/db/schema";

export function NoteList({ folderId }: { folderId?: number }) {
  const { data, error } = useLiveQuery(
    db.select().from(notes)
      .where(folderId ? eq(notes.folderId, folderId) : sql`folder_id IS NULL`)
      .orderBy(desc(notes.updatedAt))
  );

  if (error) return <ErrorView error={error} />;
  if (!data) return <LoadingView />;

  return (
    <FlatList
      data={data}
      renderItem={({ item }) => <NoteCard note={item} />}
      keyExtractor={(item) => item.id.toString()}
    />
  );
}
```

### Pattern 5: Simple Markdown Editing with Preview

**What:** Use plain TextInput for editing, separate view for markdown rendering.

**When to use:** For Phase 2 - simple, reliable, no complex dependencies.

**Example:**
```typescript
// components/markdown/MarkdownEditor.tsx
import { useState } from "react";
import { TextInput, View, ScrollView, Switch } from "react-native";
import Markdown from "react-native-markdown-display";

export function MarkdownEditor({ initialValue, onChange }: Props) {
  const [content, setContent] = useState(initialValue);
  const [isPreview, setIsPreview] = useState(false);

  const handleChange = (text: string) => {
    setContent(text);
    onChange(text);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text>Edit</Text>
        <Switch value={isPreview} onValueChange={setIsPreview} />
        <Text>Preview</Text>
      </View>

      {isPreview ? (
        <ScrollView style={{ flex: 1 }}>
          <Markdown>{content}</Markdown>
        </ScrollView>
      ) : (
        <TextInput
          multiline
          value={content}
          onChangeText={handleChange}
          style={{ flex: 1, textAlignVertical: "top" }}
        />
      )}
    </View>
  );
}
```

### Anti-Patterns to Avoid

- **Syncing before local-first works:** Don't implement sync in Phase 2 - get local functionality solid first
- **Custom markdown parser:** Don't build your own - use react-native-markdown-display which handles edge cases
- **Hand-rolled search:** Don't use LIKE queries - SQLite FTS5 is built for this and much faster
- **Storing folder path in notes:** Don't denormalize - use folderId foreign key and query hierarchy with CTEs
- **WebView-based markdown editor:** Avoid unless absolutely necessary - performance penalty and UX issues on mobile

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Full-text search | LIKE queries with wildcards | SQLite FTS5 with bm25 ranking | FTS5 handles tokenization, stemming, phrase search, proximity, and relevance ranking - LIKE is slow and feature-poor |
| Markdown rendering | Custom parser with Text components | react-native-markdown-display | Handles CommonMark spec, edge cases, syntax highlighting, customizable styles - parsing markdown correctly is complex |
| Hierarchical queries | Manual recursion in JavaScript | SQLite recursive CTEs | Database does it in one query, efficiently - JS recursion requires multiple round-trips and is error-prone |
| Database migrations | Manual ALTER TABLE scripts | Drizzle Kit migration generation | Tracks schema history, generates diffs, handles rollbacks - manual migrations miss edge cases and are tedious |
| Type-safe queries | Raw SQL strings | Drizzle ORM | Generates types from schema, catches errors at compile time, autocomplete for columns - raw SQL is error-prone |
| Reactive queries | Manual change tracking | useLiveQuery hook | Automatically subscribes to changes, re-renders on updates - manual tracking is boilerplate-heavy and bug-prone |

**Key insight:** Local-first mobile database development has matured significantly in 2025-2026. The Expo SQLite + Drizzle ORM stack provides production-ready solutions for problems that previously required custom code. SQLite FTS5 in particular is an underutilized powerhouse - it's a full search engine built into every SQLite database.

## Common Pitfalls

### Pitfall 1: Metro Bundler Doesn't Recognize .sql Files

**What goes wrong:** Drizzle Kit generates .sql migration files, but Metro bundler crashes when trying to import them because .sql isn't a recognized source extension.

**Why it happens:** Metro's default configuration only recognizes JS/TS/JSON files. When Drizzle tries to import migrations, Metro fails.

**How to avoid:**
1. Update `metro.config.js` to add 'sql' to sourceExts array:
```javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('sql');

module.exports = config;
```

2. Add babel-plugin-inline-import to `babel.config.js`:
```javascript
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ["inline-import", { "extensions": [".sql"] }]
    ],
  };
};
```

**Warning signs:** App crashes immediately on startup with "Unable to resolve module" error mentioning .sql files.

### Pitfall 2: FTS5 Index Out of Sync with Content

**What goes wrong:** Search returns outdated results or misses notes because FTS5 index wasn't updated when notes changed.

**Why it happens:** FTS5 external content tables don't automatically sync - you must use triggers. If triggers are missing, incorrect, or bypassed (e.g., updating via raw SQL), the index becomes stale.

**How to avoid:**
1. Always create INSERT/UPDATE/DELETE triggers when using external content tables
2. Use the 'delete' command in UPDATE triggers (not BEFORE triggers)
3. Never bypass Drizzle ORM with raw SQL that modifies notes table
4. Test triggers after creation:
```sql
-- Test that triggers work
INSERT INTO notes (title, content) VALUES ('Test', 'Content');
SELECT * FROM notes_fts WHERE notes_fts MATCH 'content'; -- Should find it
```

**Warning signs:** Search doesn't find recently created notes, or finds deleted notes, or shows old content for updated notes.

### Pitfall 3: KeyboardAvoidingView Doesn't Work with Multiline TextInput

**What goes wrong:** When editing markdown in a multiline TextInput, the keyboard covers the input field and user can't see what they're typing.

**Why it happens:** React Native's KeyboardAvoidingView has known issues with multiline TextInputs - it works fine for single-line inputs but doesn't adjust properly for multiline.

**How to avoid:**
1. Use `behavior="padding"` or `behavior="position"` instead of `behavior="height"`
2. Wrap TextInput in ScrollView with keyboardShouldPersistTaps="handled"
3. Consider react-native-keyboard-controller for more reliable behavior:
```typescript
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

<KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
  <ScrollView keyboardShouldPersistTaps="handled">
    <TextInput multiline {...props} />
  </ScrollView>
</KeyboardAvoidingView>
```

**Warning signs:** Keyboard covers text input, user has to scroll manually or dismiss keyboard to see cursor.

### Pitfall 4: Drizzle Migrations Run Synchronously, Blocking Render

**What goes wrong:** App shows blank screen for several seconds on cold start while migrations run.

**Why it happens:** The useMigrations hook runs synchronously and blocks rendering until database is ready. This is intentional (prevents querying before tables exist) but can feel like the app is frozen.

**How to avoid:**
1. Show a proper loading screen while migrations run
2. Keep migration count low in development (don't generate on every schema tweak)
3. Run `drizzle-kit generate` only when ready to commit schema changes
4. Consider migration squashing for production builds

**Warning signs:** App startup feels slow, blank white screen before content appears, users think app is frozen.

### Pitfall 5: Circular References in Folder Hierarchy

**What goes wrong:** A folder becomes its own ancestor (e.g., A → B → C → A), breaking queries and causing infinite loops.

**Why it happens:** No database constraint prevents folder.parentId from creating cycles. User could move folder A into subfolder of A.

**How to avoid:**
1. Validate in application code before allowing move:
```typescript
async function canMoveFolder(folderId: number, newParentId: number): Promise<boolean> {
  // Check if newParentId is a descendant of folderId
  const descendants = await getFolderTree(folderId);
  return !descendants.some(d => d.id === newParentId);
}
```
2. Use recursive CTE to detect cycles:
```sql
WITH RECURSIVE check_cycle(id, parent_id, depth) AS (
  SELECT id, parent_id, 0 FROM folders WHERE id = ?
  UNION ALL
  SELECT f.id, f.parent_id, c.depth + 1
  FROM folders f
  JOIN check_cycle c ON f.id = c.parent_id
  WHERE c.depth < 100  -- Prevent infinite loop
)
SELECT * FROM check_cycle WHERE id = parent_id;  -- If any rows, cycle exists
```

**Warning signs:** getFolderTree query never returns, app freezes when viewing certain folders, SQLite "too many SQL variables" errors.

### Pitfall 6: expo-sqlite Version Incompatibility with Drizzle

**What goes wrong:** Drizzle imports from `expo-sqlite/next` which was removed in expo-sqlite v15/SDK 52, causing "Cannot find module" errors.

**Why it happens:** Drizzle ORM's Expo driver was designed for older expo-sqlite versions and hasn't fully caught up to SDK 52 changes.

**How to avoid:**
1. Check Drizzle ORM GitHub issues for latest compatibility status
2. Use `expo-sqlite@next` if needed for compatibility
3. Pin exact versions in package.json once working combination found
4. Test after any Expo SDK or Drizzle ORM updates

**Warning signs:** "Cannot find module 'expo-sqlite/next'" error, app crashes on database initialization.

## Code Examples

Verified patterns from official sources:

### Database Initialization with Migrations
```typescript
// app/_layout.tsx
// Source: https://orm.drizzle.team/docs/connect-expo-sqlite
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { db } from "@/db/client";
import migrations from "@/db/migrations/migrations";

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return (
      <View>
        <Text>Migration error: {error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View>
        <ActivityIndicator size="large" />
        <Text>Loading database...</Text>
      </View>
    );
  }

  return <Slot />;
}
```

### Full-Text Search with Snippets
```typescript
// db/queries/search.ts
// Source: https://sqlite.org/fts5.html
import { sql } from "drizzle-orm";

export async function searchNotes(query: string) {
  // FTS5 query with BM25 ranking and snippet generation
  return db.execute(sql`
    SELECT
      n.id,
      n.title,
      snippet(notes_fts, 0, '<mark>', '</mark>', '...', 32) as titleSnippet,
      snippet(notes_fts, 1, '<mark>', '</mark>', '...', 64) as contentSnippet,
      bm25(notes_fts, 10.0, 1.0) as rank
    FROM notes_fts
    JOIN notes n ON notes_fts.rowid = n.id
    WHERE notes_fts MATCH ${query}
    ORDER BY rank
    LIMIT 50;
  `);
}

// Advanced query with phrase search and boolean operators
export async function advancedSearch(phrase: string, mustInclude?: string) {
  const query = mustInclude
    ? `"${phrase}" AND ${mustInclude}`
    : `"${phrase}"`;

  return searchNotes(query);
}
```

### Recursive Folder Tree Query
```typescript
// db/queries/folders.ts
// Source: https://medium.com/@rishabhdevmanu/from-trees-to-tables-storing-hierarchical-data-in-relational-databases-a5e5e6e1bd64
import { sql } from "drizzle-orm";

export async function getFolderWithNotes(folderId?: number) {
  // Get folder and all descendants with note counts
  return db.execute(sql`
    WITH RECURSIVE folder_tree AS (
      -- Base case: starting folder (or root if null)
      SELECT
        id,
        name,
        parent_id,
        0 as depth,
        CAST(id AS TEXT) as path
      FROM folders
      WHERE ${folderId ? sql`id = ${folderId}` : sql`parent_id IS NULL`}

      UNION ALL

      -- Recursive case: children of folders in tree
      SELECT
        f.id,
        f.name,
        f.parent_id,
        ft.depth + 1,
        ft.path || '/' || CAST(f.id AS TEXT)
      FROM folders f
      JOIN folder_tree ft ON f.parent_id = ft.id
    )
    SELECT
      ft.*,
      COUNT(n.id) as note_count
    FROM folder_tree ft
    LEFT JOIN notes n ON n.folder_id = ft.id
    GROUP BY ft.id
    ORDER BY ft.path;
  `);
}
```

### Markdown Rendering with Custom Styles
```typescript
// components/markdown/MarkdownRenderer.tsx
// Source: https://github.com/iamacup/react-native-markdown-display
import Markdown from 'react-native-markdown-display';
import { StyleSheet } from 'react-native';

const markdownStyles = StyleSheet.create({
  heading1: {
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 12,
  },
  heading2: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  code_inline: {
    backgroundColor: '#f4f4f4',
    fontFamily: 'Courier',
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  fence: {
    backgroundColor: '#f4f4f4',
    padding: 12,
    borderRadius: 6,
    fontFamily: 'Courier',
  },
  list_item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <Markdown style={markdownStyles}>
      {content}
    </Markdown>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| AsyncStorage for notes | SQLite with FTS5 | 2020-2021 | Enables relational data, full-text search, better performance at scale |
| Raw SQLite queries | Drizzle ORM with type safety | 2023-2024 | Type errors caught at compile time, better DX, generated migrations |
| Manual state management | useLiveQuery reactivity | 2024-2025 | Automatic re-renders on data changes, no manual cache invalidation |
| react-native-sqlite-storage | expo-sqlite with JSI | 2023 (SDK 50+) | Better performance, official Expo support, encryption with SQLCipher |
| Separate edit/preview screens | Live markdown (react-native-live-markdown) | 2025 | Real-time preview while typing, but requires Reanimated worklets |
| WebView markdown editors | Native component renderers | 2022-2023 | Better performance, no web context overhead, true native feel |
| Nested Sets for hierarchy | Adjacency List with recursive CTEs | 2021+ | Simpler to maintain, SQLite added better CTE support |

**Deprecated/outdated:**
- **react-native-markdown-renderer**: Unmaintained for 8 years, replaced by react-native-markdown-display
- **expo-sqlite/next import path**: Removed in SDK 52, use direct expo-sqlite import
- **Drizzle `driver: 'expo'` in older docs**: Still works but some examples show different patterns, verify current docs

## Open Questions

Things that couldn't be fully resolved:

1. **Drizzle ORM + expo-sqlite SDK 52 compatibility**
   - What we know: GitHub issue #32714 reports incompatibility, Drizzle docs still reference expo-sqlite/next
   - What's unclear: Whether latest Drizzle version (as of Jan 2026) fully supports SDK 52 or requires workarounds
   - Recommendation: Test immediately in Phase 2 Task 1, check Drizzle GitHub for latest status, be prepared to pin specific versions or use expo-sqlite@next temporarily

2. **Best practice for note auto-save timing**
   - What we know: Debouncing prevents excessive database writes, useLiveQuery handles reactivity
   - What's unclear: Optimal debounce delay (500ms? 1000ms? 2000ms?), whether to show "saving..." indicator
   - Recommendation: Start with 1000ms debounce, test on device (not simulator) for performance, gather user feedback

3. **Search performance with large note collections**
   - What we know: FTS5 is fast, BM25 ranking is built-in, indexes are efficient
   - What's unclear: At what point (1000 notes? 10,000?) does search become noticeably slow on mobile
   - Recommendation: Implement LIMIT 50 on search results, monitor performance, consider pagination if needed

4. **KeyboardAvoidingView reliability on Android**
   - What we know: KeyboardAvoidingView has issues with multiline TextInput, react-native-keyboard-controller exists as alternative
   - What's unclear: Whether built-in solution is "good enough" for Phase 2 or if keyboard-controller is necessary
   - Recommendation: Try built-in first, add keyboard-controller only if users report issues

## Sources

### Primary (HIGH confidence)
- Expo SQLite official documentation: https://docs.expo.dev/versions/latest/sdk/sqlite/
- Drizzle ORM Expo SQLite guide: https://orm.drizzle.team/docs/connect-expo-sqlite
- SQLite FTS5 official documentation: https://sqlite.org/fts5.html
- Expo local-first architecture guide: https://docs.expo.dev/guides/local-first/
- react-native-markdown-display GitHub: https://github.com/iamacup/react-native-markdown-display

### Secondary (MEDIUM confidence)
- [Best SQLite Solutions for React Native App Development in 2026](https://vibe.forem.com/eira-wexford/best-sqlite-solutions-for-react-native-app-development-in-2026-3b5l)
- [Drizzle and React Native (Expo): Local SQLite setup - LogRocket Blog](https://blog.logrocket.com/drizzle-react-native-expo-sqlite/)
- [Modern SQLite for React Native apps](https://expo.dev/blog/modern-sqlite-for-react-native-apps)
- [From Trees to Tables: Storing Hierarchical Data in Relational Databases](https://medium.com/@rishabhdevmanu/from-trees-to-tables-storing-hierarchical-data-in-relational-databases-a5e5e6e1bd64)
- [SQLite Full-Text Search: The Hidden Search Engine Inside Your Database](https://www.dbpro.app/blog/sqlite-full-text-search-fts5)
- [simonh.uk :: SQLite FTS5 Triggers](https://simonh.uk/2021/05/11/sqlite-fts5-triggers/)

### Tertiary (LOW confidence)
- [React Native project structure: a best practices guide](https://www.tricentis.com/blog/react-native-project-structure) - General RN structure, not note-taking specific
- Community discussions on folder structures and markdown editors - Multiple sources but not authoritative

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Expo and Drizzle documentation confirm all recommendations
- Architecture: HIGH - SQLite adjacency list and FTS5 are well-documented patterns with official examples
- Pitfalls: MEDIUM-HIGH - Most verified through official docs and GitHub issues, some from community reports

**Research date:** 2026-01-31
**Valid until:** 2026-02-28 (30 days - stable ecosystem, but Drizzle/Expo moving fast)
