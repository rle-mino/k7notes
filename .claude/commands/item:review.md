---
description: Review a completed item and update plan status
argument-hint: [item-number]
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
  - AskUserQuestion
---

## Context

Current backlog:
@.simplan/ITEMS.md

## Configuration

Check `.simplan/config` for settings (key=value format). Relevant setting:
- `commit_plan=true` - If set, commit `.simplan/` changes after review updates

## Status Emojis

When displaying or updating item statuses, use these emojis:
- 📋 `BACKLOG` - Not yet planned
- 📝 `PLANNED` - Has a plan, ready to execute
- ⏸️ `IDLE` - Started but paused
- 🔄 `IN_PROGRESS` - Currently being worked on
- ✅ `DONE` - Completed

## Task

Validate item #$ARGUMENTS by delegating to the **simplan:review** agent.

### Steps

1. **Parse arguments**: Get item number from `$ARGUMENTS`

2. **Validate**: If no item number provided, read the backlog and find items that need validation (IN_PROGRESS or DONE status), then use AskUserQuestion to ask which one to validate (use "Item #N" as option labels, put titles in descriptions; all labels max 30 chars)

3. **Get plan path**: Read the item's Plan path from the backlog

4. **Delegate to simplan:review**: Use the Task tool to spawn the review agent:
   ```
   Task(
     prompt="Validate item #<number>.

     Backlog file: .simplan/ITEMS.md
     Plan file: <plan-path>

     Follow your review process:
     1. Read the plan and review all changes
     2. Compare actual code state with the plan
     3. Check if all phases were properly completed
     4. Verify commits exist for each phase (code files only - .simplan/ is gitignored)
     5. Update the plan file with completion status
     6. Update backlog status to DONE if all phases complete
     7. Generate summary of what was accomplished",
     subagent_type="simplan:review",
     description="Validate item #<number>"
   )
   ```

5. **Commit (if configured)**: If `.simplan/config` contains `commit_plan=true`:
   - Ask user if they want to commit the review updates (use AskUserQuestion with "Commit review?" header, options "Yes" / "No")
   - If yes:
     - Stage the plan file (with updated review status)
     - Stage `.simplan/ITEMS.md` (if backlog status changed to DONE)
     - Create commit with message: `plan: review item #<number> - <status>`

6. **Show result**: Display the validation summary to the user

---

## Next Steps

Based on validation result, tell the user:

**If item is marked DONE:**
> Item #<number> complete!
>
> To see remaining work, run:
> `/item:progress`
>
> Tip: Run `/clear` to reset context before starting new work.

**If issues were found:**
> Validation found issues that need to be fixed.
>
> To fix and re-run, run:
> `/item:exec <phase-number>`
>
> Tip: Run `/clear` to reset context before fixing.
