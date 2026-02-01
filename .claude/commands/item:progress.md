---
description: Show next 20 backlog items (not DONE)
allowed-tools:
  - Read
---

## Task

Show a concise progress view of up to 20 items that are not DONE, with smart next-action recommendation.

### Steps

1. **Read backlog**: Read `.simplan/ITEMS.md`

2. **Filter items**:
   - Extract items where Status is NOT `DONE` (include BACKLOG, PLANNED, IDLE, IN_PROGRESS)
   - If fewer than 20 non-DONE items, fill remaining slots with DONE items (most recent first)

3. **Take first 20**: Limit to 20 total items

4. **Get phase progress and complexity**: For PLANNED, IDLE, or IN_PROGRESS items, read the plan file to:
   - Count completed phases (✅) vs total phases
   - Sum complexity scores of remaining phases (if complexity scores exist)
   - Identify the next phase to execute

5. **Display as table**:

```
| #  | Item                              | Progress | Remaining | Status      |
|----|-----------------------------------|----------|-----------|-------------|
| 1  | Cursor ignores markers            | 2/3      | Cx: 3     | IN_PROGRESS |
| 2  | MIDI not detected                 | 1/2      | Cx: 2     | IDLE        |
| 3  | Workflows system                  | 0/2      | Cx: 5     | PLANNED     |
| 4  | Add dark mode                     | -        | -         | BACKLOG     |
|    |                                   |          |           |             |
| 5  | Fix login bug                     | 2/2      | -         | DONE        |
```

- **Item**: Title truncated to ~30 chars
- **Progress**: `done/total` phases, or `-` if no plan
- **Remaining**: `Cx: N` sum of complexity for incomplete phases, or `-` if no plan/scores
- **Status**: BACKLOG, PLANNED, IDLE, IN_PROGRESS, DONE
- Add a blank separator row before DONE items if any are shown

If no items exist, say "No items."

6. **Smart recommendation**: Analyze the backlog and recommend the best next action:

   **Priority order for "what to work on next":**
   1. Continue IN_PROGRESS item (if exists)
   2. Resume IDLE item closest to completion (highest done/total ratio)
   3. Start PLANNED item with lowest remaining complexity
   4. Plan a BACKLOG item (suggest brainstorm for complex descriptions)

   **Display recommendation:**

   ```
   ## Recommended Next Action

   **Continue Item #1: Cursor ignores markers**
   - Progress: 2/3 phases (67%)
   - Next phase: Phase 3 - "Add error handling" (Cx: 3)
   - Run: `/item:exec`
   ```

   Or for starting a new item:

   ```
   ## Recommended Next Action

   **Start Item #3: Workflows system** (lowest remaining complexity)
   - Phases: 2 total, Cx: 5
   - First phase: Phase 1 - "Define workflow schema" (Cx: 2)
   - Run: `/item:exec 3`

   Other ready items:
   - Item #2: MIDI not detected (1/2 done, Cx: 2 remaining)
   ```

   Or for planning:

   ```
   ## Recommended Next Action

   **Plan Item #4: Add dark mode**
   - This looks straightforward → `/item:plan 4`

   **Plan Item #5: Redesign auth system**
   - This seems complex → `/item:brainstorm 5`
   ```

---

## Next Steps

Always end with:

> **Quick commands:**
> - `/item:exec` — continue/start next item
> - `/item:exec <num>` — work on specific item
> - `/item:plan <num>` — plan a backlog item
> - `/item:add` — add new item
>
> Tip: Run `/clear` to reset context before starting work.
