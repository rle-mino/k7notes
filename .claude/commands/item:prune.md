---
description: Remove all DONE items from the backlog
argument-hint:
allowed-tools:
  - Read
  - Bash
  - Glob
  - AskUserQuestion
---

## Context

Read the `.simplan/items/` directory to see existing items. Each subdirectory is an item slug containing an `ITEM.md` file.

## Task

Purge all completed items from the backlog. Keep this lightweight - no agent delegation needed.

### Steps

1. **Read items**: Read all `.simplan/items/*/ITEM.md` files and identify items with status `✅ DONE`

2. **Check for work**: If no DONE items exist, inform the user and exit

3. **List items to purge**: Show the user all DONE items that will be removed (by slug and title)

4. **Confirm**: Use AskUserQuestion to confirm before proceeding:
   - Option 1: "Yes, purge all"
   - Option 2: "Cancel"

5. **Delete item folders**: For each DONE item, delete its entire `.simplan/items/<slug>/` directory

6. **Show result**: Display summary of purged items and remaining items

---

## Next Steps

Tell the user:

> Purged <count> completed item(s)!
>
> To see your updated backlog, run:
> `/item:progress`
>
> Tip: Run `/clear` to reset context before continuing.
