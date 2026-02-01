---
description: Remove all DONE items from the backlog
argument-hint:
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - AskUserQuestion
---

## Context

Current backlog:
@.simplan/ITEMS.md

## Task

Purge all completed items from the backlog. Keep this lightweight - no agent delegation needed.

### Steps

1. **Read backlog**: Identify all items with status `✅ DONE`

2. **Check for work**: If no DONE items exist, inform the user and exit

3. **List items to purge**: Show the user all DONE items that will be removed

4. **Confirm**: Use AskUserQuestion to confirm before proceeding:
   - Option 1: "Yes, purge all DONE items"
   - Option 2: "Cancel"

5. **Delete plan files**: For each DONE item, delete its plan file/folder if it exists

6. **Remove items**: Delete all DONE item sections from `.simplan/ITEMS.md`

7. **Renumber remaining items**: Update all remaining items to be sequential (1, 2, 3, ...) and update their slugs accordingly

8. **Rename plan files/folders**: Rename any plan files/folders for renumbered items to match new numbers (e.g., `5-auth.md` → `2-auth.md`)

9. **Update Plan paths**: Update the Plan path references in the backlog for renamed items

10. **Show result**: Display summary of purged items and the updated backlog

---

## Next Steps

Tell the user:

> Purged <count> completed item(s)!
>
> To see your updated backlog, run:
> `/item:progress`
>
> Tip: Run `/clear` to reset context before continuing.
