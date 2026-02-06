---
name: commit
description: Clean commit with pre-flight checks
---

## Steps
1. Kill any processes on ports 4000 and 4001: `lsof -ti:4000,4001 | xargs kill -9 2>/dev/null || true`
2. Run `pnpm turbo type-check` - fix any errors before proceeding
3. Run `pnpm turbo test` - ensure all tests pass
4. Stage only the files related to the current change (no unrelated files)
5. Write a conventional commit message
6. Run `git commit` (never use --no-verify)
7. If commit fails due to pre-commit hooks, diagnose and fix the root cause
