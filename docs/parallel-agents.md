# Parallel agents

How work in this repository is specified, split across git worktrees, implemented by agents,
reviewed and merged. The mechanics live in the skills and agents under [.claude/](../.claude/);
this page is the overview and the reasoning.

## The flow

```
idea ─► spec ─► ready? ─► worktree + branch ─► agent pipeline per task ─► draft PR ─► CI ─► review ─► merge (human) ─► cleanup
         │        │
         │        └─ no: /refine-issue or spec-refiner → open questions answered by the maintainer
         └─ /create-issue or docs/specs/NNNN-*.md from the template
```

## 1. Specify

Every piece of work starts as a spec: a file in [docs/specs/](specs/) from the
[template](specs/TEMPLATE.md), or an issue with the same sections (`/create-issue`). The spec is
the agent's only input. Two rules carry most of the weight:

- **Acceptance criteria are observable.** "Clicking copy puts the text on the clipboard", not
  "implement copy". A criterion an agent cannot check is one it will interpret.
- **Nothing is guessed.** A label text, a default, behaviour on failure — whatever the spec does
  not say becomes an open question, and a spec with open questions is not ready. A wrong guess
  costs a review round and often a second PR; a question costs a minute.

`/refine-issue` (interactive) or the `spec-refiner` agent checks a spec against the Definition of
Ready at the bottom of the template. [0001-copy-message-action.md](specs/0001-copy-message-action.md)
is an example of a ready spec.

**Size:** one spec = one reviewable PR. Anything bigger is split into several specs before work
starts, not into a giant PR.

## 2. Split across worktrees

Each spec gets its own branch and its own sibling worktree:

```bash
git fetch origin main
git worktree add --no-track -b feat/42-copy-message-action ../juneau-42 origin/main
npm --prefix ../juneau-42 ci --include=dev
```

Why worktrees and not branch switching:

- **The main checkout belongs to the maintainer.** Their `npm run dev` and Storybook run from it in
  watch mode; a branch switch there would reload their servers onto code they did not ask for and
  mix with their uncommitted work.
- **Isolation.** Two agents on two specs never share a working tree, an index or a branch, so they
  can run at the same time — one session per worktree, or one session orchestrating several.
- **Siblings, not subfolders.** A worktree inside the repo would be picked up by Vitest, TypeScript
  and Storybook globs as a second copy of `src/`.

What can run in parallel and what cannot is in
[WORKTREES.md § What stays one-at-a-time](../.claude/skills/implement-issue/WORKTREES.md#what-stays-one-at-a-time):
tests, typechecks and builds are fine side by side; fixed dev-server ports and tracker writes are
not. Specs that touch the same files (two features in `AiMessageBubble`) are run one after
another or stacked — the second branch starts from the first one's pushed branch and its PR
targets that branch — rather than racing to a merge conflict.

## 3. Implement

`/implement-issue <ref | spec path>` drives one spec end to end. Inside a worktree, every task goes
through the same pipeline ([.claude/agents/README.md](../.claude/agents/README.md)):

```
architect ─► implementer ─► verifier ─► reviewer (+ security, i18n, test-reviewer) ─► fixes ─► docs-keeper ─► commit
```

- **Subagents keep the main context clean.** The orchestrating session sees reports, not test logs
  or file dumps, so it can steer several tasks without losing the thread.
- **A strong checker over a weaker doer.** Review, security and planning get more reasoning effort
  than routine implementation, and read-only checkers have no edit tools — they report, the
  implementer fixes, the verifier re-checks.
- **Every prompt names the absolute worktree path**, the task, its definition of done and the
  branch. A subagent sees nothing else.
- **Tests first.** A bug fix starts with a regression test that fails.

After the first task a draft PR is opened and updated after each later one, so progress is visible
and nothing lives only on a laptop.

## 4. Review

Three layers, cheapest first:

1. **Agent review inside the pipeline** — `reviewer` against the spec and CLAUDE.md, plus the
   conditional checkers. Findings are applied before the commit.
2. **CI** ([.github/workflows/ci.yml](../.github/workflows/ci.yml)) — typecheck, unit tests and
   the build on every PR. `/fix-pr` reads failed logs, separates the PR's own failures from flaky
   infrastructure and fixes them, at most three fix pushes before it hands back. It never makes CI
   green by weakening a check.
3. **Human review** — the maintainer reads the PR commit by commit, guided by the task table in
   its body. `/address-pr-comments` (with approval per thread) or `/implement-issue` (on re-run)
   works through the threads: fix, push, then reply naming the commit, then resolve. A thread is
   never resolved silently, and a human's thread that asks for something out of scope stays open
   for the maintainer.

`/pr-gate` runs everything locally before merging a large PR, including the Storybook story tests
CI does not run.

## 5. Merge

**Only the maintainer merges.** No agent merges, force-pushes, amends pushed commits or bypasses
hooks — those rules are in CLAUDE.md and repeated in every skill that touches git. `/sync-main`
keeps a long-running branch current by merging `main` in (never rebasing published history).

After the merge, `/implement-issue` (on its next run) or `/clean-merged-branches` removes the
worktree — only when it has no uncommitted changes — and deletes the local branch.

## Where each rule lives

| Concern | File |
|---|---|
| Project rules, definition of done, agent rules | [CLAUDE.md](../CLAUDE.md) |
| Agents, pipeline, handing work over | [.claude/agents/README.md](../.claude/agents/README.md) |
| Spec template and Definition of Ready | [docs/specs/TEMPLATE.md](specs/TEMPLATE.md) |
| Worktree mechanics | [.claude/skills/implement-issue/WORKTREES.md](../.claude/skills/implement-issue/WORKTREES.md) |
| Issue tracker mechanics (GitHub Issues or other) | [.claude/skills/implement-issue/TRACKER.md](../.claude/skills/implement-issue/TRACKER.md) |
| Commit and PR format | [.claude/skills/commit/](../.claude/skills/commit/) |
