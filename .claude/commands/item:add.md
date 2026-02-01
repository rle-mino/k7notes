---
description: Add a new item to the backlog
argument-hint: [title]
allowed-tools:
  - Read
  - Write
  - Edit
  - AskUserQuestion
---

## Context

Current backlog:
@.simplan/ITEMS.md

## Task

Add a new item to the backlog. Keep this lightweight - no agent delegation needed.

### Steps

1. **Read backlog**: Count existing items to determine the next item number

2. **Get details**: Use AskUserQuestion to ask for:
   - **Title**: Short, descriptive title (or use from `$ARGUMENTS` if provided)
   - **Type**: Feature or Fix
   - **Description**: What needs to be done

3. **Generate slug**: Create a URL-friendly slug from the title:
   - Lowercase the title
   - Replace spaces with hyphens
   - Remove special characters
   - Keep it short (max 30 chars)
   - Example: "Add user authentication" → "add-user-authentication"

4. **Append item**: Add to `.simplan/ITEMS.md`:

```markdown
## Item #<number>: <title>
- **Type**: <type-emoji> <Feature|Fix>
- **Status**: 📋 BACKLOG
- **Description**: <description>
- **Slug**: <slug>
- **Plan**: None
```

**Type emojis:**
- ✨ Feature
- 🐛 Fix

**Status emojis:**
- 📋 BACKLOG
- 📝 PLANNED
- 🚧 IN_PROGRESS
- ⏸️ IDLE
- ✅ DONE

5. **Confirm**: Show the added item with its number and slug

6. **Assess complexity**: Based on the description, estimate complexity:

   **Simple** (suggest `/item:plan`):
   - Bug fixes with clear reproduction steps
   - Single-file changes
   - Well-defined, narrow scope
   - "Add X to Y" style tasks

   **Complex** (suggest `/item:brainstorm`):
   - New features touching multiple systems
   - Architectural decisions needed
   - Unclear requirements or multiple approaches
   - Integration with external services/APIs
   - Security-sensitive changes
   - Performance optimization without clear target

---

## Next Steps

Based on complexity assessment, recommend:

**For simple items:**
> Item #<number> added! This looks straightforward.
>
> To plan this item, run:
> `/item:plan <number>`
>
> Tip: Run `/clear` to reset context before planning.

**For complex items:**
> Item #<number> added! This seems complex—I'd recommend brainstorming first.
>
> To brainstorm this item, run:
> `/item:brainstorm <number>`
>
> Or if you already know the approach: `/item:plan <number>`
>
> Tip: Run `/clear` to reset context before planning.
