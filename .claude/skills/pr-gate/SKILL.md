---
name: pr-gate
description: Full pre-merge gate for a PR — syncs the branch with origin/main, then runs every check the repo has in parallel (typecheck, unit tests, Storybook story tests, library build, Storybook build) and reports a PASS/FAIL table with the first error of each failure. Use when the user says "pr gate", "full test before merge", "pre-merge check", "run everything", or invokes /pr-gate.
---

# PR gate

Everything CI runs, plus the checks CI skips (Storybook story tests in a real browser, the static
Storybook build), against the branch as it will look after merge.

## Steps

1. **Sync with main first.** `git status --short`; if dirty, STOP and ask (stash or commit). Then
   invoke the [sync-main](../sync-main/SKILL.md) skill. If it reports conflicts, STOP — a gate on
   an unmerged branch proves nothing.

2. **Preflight.** `node_modules` exists (else `npm ci --include=dev`). For story tests, Chromium for
   Playwright is installed (`npx playwright install chromium` once; if it cannot be installed,
   SKIP that step with the reason).

3. **Run in parallel**, each as its own background command with output saved to a scratch file:

   | Step         | Command                                  |
   | ------------ | ---------------------------------------- |
   | `typecheck`  | `npm run typecheck`                      |
   | `unit`       | `npx vitest run --project unit`          |
   | `stories`    | `npx vitest run --project storybook`     |
   | `build`      | `npm run build`                          |
   | `storybook`  | `npm run build-storybook`                |

   `build` writes `dist/` and `build-storybook` writes `storybook-static/`; both are gitignored.

4. **Read the results.** For every FAIL, read its log and extract the failing test names, file paths
   and the first error — not the whole log. A SKIP is reported with its reason, never hidden.

5. **Report** one table: step, result, duration, and for failures a one-line cause with `path:line`.
   Say plainly whether the branch is mergeable. Do not fix anything unless asked; a failure goes to
   `debugger` or the `implementer`.
