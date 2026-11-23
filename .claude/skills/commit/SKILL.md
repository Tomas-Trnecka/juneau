---
name: commit
description: Commit the current changes with a conventional-commits message, and on request continue the pipeline — create a branch if still on main, push, and open a GitHub PR with an inferred title and body. Use when the user says "commit", "commit and push", "create pr", "open a PR", "ship it", asks for a commit message, or when the commit-msg hook rejects a message.
---

# Commit → push → PR

One pipeline with three stop points. Every stage is idempotent: skip what is already done
(nothing to commit, upstream exists, PR already open) and continue to the requested stop.

## How far to go

| Ask                                              | Stages run                          |
| ------------------------------------------------ | ----------------------------------- |
| `/commit`, "commit"                              | branch (only if on `main`) → commit |
| `/commit push`, "commit and push"                | … → push                            |
| `/commit pr`, "commit and create PR", "ship it"  | … → push → PR                       |

Never push or open a PR when the user only asked to commit.

## Workflow

1. **Inspect** — run in parallel: `git status --short`, `git diff --stat`, `git diff`,
   `git diff --cached`, `git log --oneline -10`, `git branch --show-current`,
   `git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null`, and for the PR stop
   `gh pr view --json number,url 2>/dev/null`.

2. **Branch** — only when on `main`. Never commit there. Name it `<type>/<issue>-<slug>` when an
   issue exists (`feat/42-copy-message-action`), else `<type>/<slug>`: type from the change, slug
   of 2–6 kebab-case words. Confirm the name, then `git checkout -b <branch>` — uncommitted changes
   carry over, so do **not** sync `main` first with a dirty tree (`/sync-main` can merge later).

3. **Commit** — stage only what the user asked for (explicit paths, never `git add -A` blindly; no
   secrets, no `dist/`). Compose the message per [COMMIT-MESSAGE.md](COMMIT-MESSAGE.md) and commit
   with a heredoc so the body keeps its line breaks:

   ```bash
   git commit -F - <<'EOF'
   feat(ui): add a copy action to assistant messages

   Adds an optional copy button under assistant bubbles ...

   Refs: #42
   EOF
   ```

   If the local `commit-msg` hook rejects the message, fix the message and retry.

4. **Push** — `git push -u origin <branch>` when there is no upstream, else `git push`. If the
   push is rejected because the remote is ahead, STOP and tell the user to sync first; never force.

5. **PR** — if `gh pr view` found one, print its URL and stop. Otherwise `git fetch origin main`,
   then in parallel `git log --reverse --pretty=format:'%h %s%n%b%n---' origin/main..HEAD` and
   `git diff --stat origin/main...HEAD`. Draft the title and body per
   [PULL-REQUEST.md](PULL-REQUEST.md), show them and ask for one round of feedback (skip the round
   when the user said to go without questions). Then `gh pr create --base main --title … --body …`.

6. **Report** — one short block: `git log -1 --stat` for the commit, the push result, and for a PR
   its URL, title and commit count.

## Rules

- One logical change per commit. If the diff covers unrelated concerns, propose a split and let the
  user decide before committing.
- Never amend, rebase or force-push commits already pushed, and never `--no-verify`.
- Never open the PR as draft unless asked, and never invent an issue reference.
- If the branch name is unparseable (`wip`), ask for an explicit type and title.
