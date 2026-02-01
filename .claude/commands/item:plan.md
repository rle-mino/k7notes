---
description: Plan an item with phases before coding
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
  - WebFetch
  - WebSearch
  - mcp__context7__resolve-library-id
  - mcp__context7__query-docs
---

## Context

Current backlog:
@.simplan/ITEMS.md

## Status Emojis

When displaying or updating item statuses, use these emojis:
- 📋 `BACKLOG` - Not yet planned
- 📝 `PLANNED` - Has a plan, ready to execute
- ⏸️ `IDLE` - Started but paused
- 🔄 `IN_PROGRESS` - Currently being worked on
- ✅ `DONE` - Completed

## Task

Plan item #$ARGUMENTS through an interactive explore-question loop.

## Process

### Step 1: Parse & Validate

1. Get item number from `$ARGUMENTS`
2. If no item number provided:
   - Read the backlog and list items with status `BACKLOG`
   - Use **AskUserQuestion** to ask which one to plan
3. Extract item details: number, slug, title, description

### Step 2: Explore-Question Loop (max 3 iterations)

Repeat the following loop until you have enough context to create a solid plan (max 3 iterations):

#### 2a. Explore the Codebase

Use Glob, Grep, and Read to understand:
- Directory structure and organization
- Key files related to the item
- Existing patterns and conventions
- Code that might be affected by the change

Use WebFetch/WebSearch/Context7 if you need external documentation (libraries, APIs, etc.).

**After exploring, summarize what you learned** in a brief internal note (don't write to file yet).

#### 2b. Ask Clarifying Questions

**Use AskUserQuestion** to ask 1-4 questions based on what you discovered. Focus on:

- **Gray areas**: Things that could go multiple ways
- **Preferences**: How the user wants it done
- **Constraints**: Limitations or requirements
- **Scope**: What's in/out of this item

Adapt questions based on previous answers. Don't re-ask what's already clear.

#### 2c. Ask About Completion Conditions (Once per session)

During one of your question rounds, ask the user about **completion conditions**:

> "Would you like to define **completion conditions** for this item? These are verifiable criteria the model will check to ensure the work is done correctly.
>
> **Two parts to define:**
>
> 1. **Validation commands** - Shell commands the model runs to test its own work:
>    - `npm test` or `pytest` (run test suite)
>    - `npm run typecheck` or `tsc --noEmit` (type checking)
>    - `npm run lint` or `eslint .` (linting)
>    - `npm run build` (build succeeds)
>    - `curl localhost:3000/api/health` (API responds)
>
> 2. **Expected outcomes** - What success looks like:
>    - "All tests pass (exit code 0)"
>    - "No TypeScript errors"
>    - "Build completes without warnings"
>    - "API returns 200 with `{status: 'ok'}`"
>
> Setting completion conditions allows the model to **iterate automatically** until all criteria pass, which **increases output quality**. This is optional but recommended."

If the user provides completion conditions:
- Record them in the plan under a dedicated "Completion Conditions" section
- Include both the **validation command** and **expected outcome** for each condition
- The executor will run these commands after implementation and iterate if they fail
- The reviewer will verify all conditions pass before approval

If the user declines or has none, note "None specified" and proceed.

#### 2d. Decide: Loop or Proceed?

After each Q&A round, evaluate:
- Do I understand the requirements well enough?
- Are there still ambiguities that need exploration?
- Have I reached the max iterations (3)?

If confident OR max iterations reached → proceed to Step 3.
Otherwise → loop back to 2a with focused exploration based on answers.

### Step 3: Create the Plan

Break the item into **phases**. Each phase should be:
- **Atomic**: Can be completed independently
- **Commitable**: Results in a working state
- **Small**: Ideally 1-3 files changed
- **Ordered**: Dependencies come first
- **Bisect-compliant**: Must pass all precommit hooks (tests, linting, type checks)

**Bisect compliance is critical.** Every phase commit must leave the codebase in a valid state:
- If adding a new function, don't call it until a later phase unless both are in the same commit
- If changing an interface, update all callers in the same phase
- If adding tests, ensure the implementation exists first (or include both together)
- Never leave dead code, broken imports, or type errors between phases

**Group phases into steps for parallel execution:**
- Phases in the same step have NO dependencies on each other
- Phases in step N+1 may depend on phases in step N (or earlier)
- A step can have 1-4 phases
- When in doubt, put phases in separate steps (safer)

**Criteria for same-step grouping:**
- Different files with no shared imports
- Independent features that don't interact
- Tests for different components

**Criteria for separate steps:**
- One phase creates something another uses
- Shared file modifications
- Interface changes that affect other phases

For each phase, specify:
- Clear tasks (as a checklist)
- Files that will be modified/created
- A suggested commit message
- Any bisect considerations (e.g., "must include X to avoid broken imports")
- **Step number** for parallel execution grouping
- **Complexity score** (1-5): Estimate effort/risk for the phase

**Complexity scoring guide:**
| Score | Meaning | Examples |
|-------|---------|----------|
| 1 | Trivial | Config change, add import, rename |
| 2 | Simple | Add function, update UI text, fix typo in logic |
| 3 | Moderate | New component, API endpoint, test suite |
| 4 | Complex | Multi-file refactor, new integration, schema change |
| 5 | High-risk | Architecture change, security-critical, performance-sensitive |

### Step 4: Write the Plan File

Write the plan to `.simplan/plans/<number>-<slug>.md` using this format:

```markdown
# Plan: Item #<number> - <title>

## Context
<What you learned about the codebase relevant to this item>

## Clarifications
<Questions you asked and answers received>

## Completion Conditions
<"None specified" if user declined, otherwise list each condition:>

| Condition | Validation Command | Expected Outcome |
|-----------|-------------------|------------------|
| Tests pass | `npm test` | Exit code 0, all tests green |
| Type check | `npm run typecheck` | No errors |
| ... | ... | ... |

## Execution Steps

| Step | Phases | Description |
|------|--------|-------------|
| 1    | 1, 2   | <why these are independent> |
| 2    | 3      | <why this depends on step 1> |

> **Parallelism**: Phases within the same step can run in parallel (max 4).

## Phases

### ⬜ Phase 1: <title>
- **Step**: 1
- **Complexity**: 2
- [ ] <task>
- [ ] <task>
- **Files**: <list of files>
- **Commit message**: `<message>`
- **Bisect note**: <why this phase is self-contained, or "N/A" if obvious>

### ⬜ Phase 2: <title>
- **Step**: 1
- **Complexity**: 3
- [ ] <task>
- [ ] <task>
- **Files**: <list of files>
- **Commit message**: `<message>`
- **Bisect note**: <why this phase is self-contained, or "N/A" if obvious>

### ⬜ Phase 3: <title>
- **Step**: 2
- **Complexity**: 2
- [ ] <task>
- [ ] <task>
- **Files**: <list of files>
- **Commit message**: `<message>`
- **Bisect note**: <why this phase is self-contained, or "N/A" if obvious>

## Phase Status Legend

| Emoji | Status |
|-------|--------|
| ⬜ | Not started |
| 🔄 | In progress |
| ✅ | Completed |

## Current Status
- **Current Phase**: Not started
- **Progress**: 0/<total phases>
```

For extensive plans (5+ phases), use a folder structure:
- `.simplan/plans/<number>-<slug>/README.md` - Main overview
- `.simplan/plans/<number>-<slug>/phase-1.md` - Phase details
- etc.

### Step 5: Update Backlog

Update the item in `.simplan/ITEMS.md`:
- Set status to `PLANNED`
- Set the **Plan** field to the plan file path

### Step 6: Show Result & Commit

Display the created plan summary to the user, including a **plan recap table**:

```markdown
## Plan Recap

| Phase | Step | Cx | Title | Files | Commit |
|-------|------|----|-------|-------|--------|
| 1     | 1    | 2  | <phase title> | <file count> files | `<short commit msg>` |
| 2     | 1    | 3  | <phase title> | <file count> files | `<short commit msg>` |
| 3     | 2    | 2  | <phase title> | <file count> files | `<short commit msg>` |

**Total complexity: 7** (sum of all phases)
```

**Complexity guidance:**
- Total 1-5: Quick task, should be done in one session
- Total 6-12: Medium task, may span multiple sessions
- Total 13+: Large task, consider breaking into multiple items

**Note**: The `.simplan/` folder is gitignored, so plan files are not committed to the repository.

---

## Guidelines

- **Keep phases small** - prefer many small phases over few large ones
- **Keep plans concise** - focus on data structures and APIs, not full implementations
- **Don't assume** - if something is unclear, ask!
- **Scope guardrail** - if user suggests new capabilities, note them as separate items
- **Consider testing** - note testing implications in phases
- **Note risks** - flag dependencies or potential issues
- **Bisect compliance** - every phase must pass precommit hooks; if in doubt, merge phases together rather than risk a broken intermediate state

---

## Next Steps

After creating the plan, tell the user:

> Item #<number> is now PLANNED with <N> phases!
>
> To start executing, run:
> `/item:exec`
>
> Tip: Run `/clear` to reset context before executing.
