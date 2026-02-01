---
description: Remove an item from the backlog
argument-hint: [item-number]
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

Delete an item from the backlog. Keep this lightweight - no agent delegation needed.

### Steps

1. **Parse arguments**: Get item number from `$ARGUMENTS`

2. **Validate**: If no item number provided, read backlog, list all items, and use AskUserQuestion to ask which one to delete

3. **Confirm deletion**: Use AskUserQuestion to confirm before proceeding

4. **Get plan path**: Note the item's Plan path before deletion

5. **Remove item**: Delete the item section from `.simplan/ITEMS.md`

6. **Renumber items**: Update all remaining items to be sequential (1, 2, 3, ...) and update their slugs accordingly

7. **Delete plan**: If the plan file/folder exists, delete it

8. **Rename plan files/folders**: Rename any plan files/folders for renumbered items to match new numbers (e.g., `3-auth.md` → `2-auth.md`)

9. **Update Plan paths**: Update the Plan path references in the backlog for renamed items

10. **Show result**: Display the updated backlog

---

## Next Steps

Tell the user:

> Item deleted!
>
> To see your updated backlog, run:
> `/item:progress`
>
> Tip: Run `/clear` to reset context before continuing.
