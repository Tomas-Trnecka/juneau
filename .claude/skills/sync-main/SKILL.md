---
name: sync-main
description: Merge the latest origin/main into the current PR branch, typecheck when code changed, and push. Use when the user says "sync main", "merge main", "update from main", or invokes /sync-main.
---

# Sync main

Bring the current branch up to date with `main` by merging — never rebasing. A merge keeps pushed
history intact, so nobody's checkout or open review breaks.

## Steps

1. **Verify state**, in parallel:
   - `git status --short` — if dirty, STOP and ask whether to stash or commit first.
   - `git rev-parse --abbrev-ref HEAD` — if `main`, STOP: nothing to sync.
   - `git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null` — confirm the branch tracks
     a remote.

2. **Fetch:** `git fetch origin main`.

3. **Check divergence:** `git rev-list --left-right --count HEAD...origin/main`. If `origin/main`
   has 0 new commits, report "already up to date with main" and stop.

4. **Merge:**

   ```bash
   git merge --no-ff origin/main -m "Merge branch 'main' into $(git rev-parse --abbrev-ref HEAD)"
   ```

   On conflicts, STOP: list the conflicting files and ask the user to resolve. Do not auto-resolve,
   abort or reset.

5. **Verify** when the merge touched `package.json`, `tsconfig*.json` or any `.ts`/`.tsx` file: run
   `npm run typecheck`. Do not push on failure — report the errors and ask.

6. **Push:** `git push` (no force).

7. **Report:** branch name, number of commits merged from main, push result.

## Constraints

- NEVER `git reset --hard`, `git push --force`, `git rebase` or `git merge --abort` without
  explicit user confirmation.
- NEVER `--no-verify`.
- On anything unexpected (detached HEAD, conflicts, failed push), STOP and report — do not recover
  automatically.
