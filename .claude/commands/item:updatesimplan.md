---
description: Update simplan framework and initialize .simplan/
argument-hint:
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
  - Write
  - Edit
  - WebFetch
  - AskUserQuestion
---

## Task

You are updating the simplan framework. Follow these steps in order:

### Step 1: Detect Installation Mode and Platform

Check for version files to determine installation type and platform:

**Claude Code:**
- `${XDG_CONFIG_HOME:-$HOME/.config}/simplan-source/.version` → Global installation
- `.claude/.simplan-version` → Local installation

**OpenCode:**
- `${XDG_CONFIG_HOME:-$HOME/.config}/simplan-source/.version` → Global installation
- `.opencode/.simplan-version` → Local installation

Read the version file to get current installed version.

If neither exists, inform the user that simplan is not installed and provide installation instructions:
```
curl -fsSL https://raw.githubusercontent.com/rle-mino/simplan/main/install.sh | bash
# OR for global install:
curl -fsSL https://raw.githubusercontent.com/rle-mino/simplan/main/install.sh | bash -s -- --global
```

### Step 2: Fetch Latest Version Info

Fetch from GitHub:
- VERSION file: https://raw.githubusercontent.com/rle-mino/simplan/main/VERSION
- CHANGELOG.md: https://raw.githubusercontent.com/rle-mino/simplan/main/CHANGELOG.md

Compare versions. If already up-to-date, inform user and skip to Step 4.
Otherwise, show changelog entries between current and latest version.

### Step 3: Run Update

Ask user for confirmation before updating using AskUserQuestion.

Execute the appropriate install command:
- Global: `curl -fsSL https://raw.githubusercontent.com/rle-mino/simplan/main/install.sh | bash -s -- --global`
- Local: `curl -fsSL https://raw.githubusercontent.com/rle-mino/simplan/main/install.sh | bash`

Report the update result. The installer will automatically clean up deprecated files.

### Step 4: Check for .simplan/ Initialization

If no `.simplan/` folder exists in the current project:
- Ask user if they want to initialize it using AskUserQuestion
- If confirmed, create:
  - `.simplan/` directory
  - `.simplan/plans/` directory
  - `.simplan/ITEMS.md` with template:

```markdown
# Backlog

## In Progress

(none)

## Planned

(none)

## Backlog

(none)

## Done

(none)
```

### Step 5: Report Summary

Provide a summary:
- Framework version: X.X.X → Y.Y.Y (or "already up-to-date")
- .simplan/ initialized (if created)
- Any deprecated files that were cleaned up (reported by installer)

---

## Next Steps

Tell the user:

> Simplan updated to <version>!
>
> To load the new commands, restart Claude Code:
> `/exit` then reopen
