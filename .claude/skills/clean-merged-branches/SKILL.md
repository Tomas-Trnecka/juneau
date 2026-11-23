---
name: clean-merged-branches
description: Delete local branches whose changes already landed on main, including squash- and rebase-merged ones, and remove their clean worktrees. Use when the user says "clean branches", "delete merged branches", "prune branches", or invokes /clean-merged-branches.
---

# Clean merged branches

Delete every local branch already merged into `main`, catching regular merges as well as squash and
rebase merges. Local only — remote branches are never touched.

## Steps

1. **Verify state**, in parallel: `git status --short` (if dirty, STOP and ask),
   `git rev-parse --abbrev-ref HEAD` (the current branch is protected) and `git worktree list`.

2. **Fetch and prune:** `git fetch --prune origin`.

3. **Collect candidates** from three sources and union them:
   - **Ancestry** — `git branch --merged origin/main --format='%(refname:short)'` (regular merges,
     fast-forwards).
   - **Gone upstream** — `git branch -vv | awk '/: gone\]/ {print $1}'` (the remote branch was
     deleted after a squash-merged PR).
   - **Cherry-equivalent** — for each remaining branch, `git cherry origin/main <branch>`; merged
     when every line starts with `-`. Skip branches with any `+` line.

4. **Filter out** `main`, the current branch and `HEAD`.

5. **Worktrees.** A candidate checked out in a sibling worktree (`../juneau-*`) is removed with
   `git worktree remove <path>` first — only when `git -C <path> status --short` is empty. A
   worktree with changes keeps its branch; report it.

6. **Confirm.** If empty, report "no merged branches to delete" and stop. Otherwise show the list
   grouped by heuristic (ancestry / gone / cherry), with any worktree to remove, and ask.

7. **Delete** each confirmed branch with `git branch -d`. Branches flagged only by `gone` or
   `cherry` usually fail with `-d` because their tips are not ancestors of `main`; for each of
   those ask whether to retry with `-D`. Never auto-escalate.

8. **Report:** number deleted, plus any skipped or failed branches and why.

## Constraints

- NEVER `git branch -D` without explicit per-branch confirmation.
- NEVER delete `main` or the checked-out branch.
- NEVER `git worktree remove --force`, and never remove a worktree with uncommitted changes.
- NEVER touch remote branches.
