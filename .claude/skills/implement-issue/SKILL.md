---
name: implement-issue
description: >-
  Implement an issue or a spec end to end as ONE pull request — read it, split it into tasks when it has none, one branch and sibling worktree, every task committed through the agent pipeline, a draft PR updated after each task and marked ready after the last, then CI watch and fixes, review comments and the after-merge cleanup. Works with GitHub Issues, another tracker, or a spec file. Use when the user says "implement #42", "work on #42", "implement docs/specs/0001-…", "address review on #42", "#42 is merged", or invokes /implement-issue.
---

# Implement issue

The unit of delivery is the **issue**: one issue = one branch = one worktree = one PR. Its tasks are
ordered steps on that branch — each lands as its own commits, so a reviewer can read the PR commit
by commit. Why one PR: every PR pays for a full CI run and a review pass; one per issue pays once.

- Tracker mechanics — [TRACKER.md](TRACKER.md)
- Worktrees — [WORKTREES.md](WORKTREES.md)
- Agent pipeline — [.claude/agents/README.md](../../agents/README.md)

## Preflight

Run in parallel:

1. `git worktree list` — to find a worktree that already holds the issue's branch.
2. `gh auth status` — if it fails, STOP and ask for `gh auth login`.
3. Read the issue per [TRACKER.md](TRACKER.md), with its comments and linked issues, or the spec
   file. No reference → ask.

STOP and ask when the issue is closed, assigned to someone else, or marked blocked.

## Ready?

The issue must meet the Definition of Ready in [docs/specs/TEMPLATE.md](../../../docs/specs/TEMPLATE.md):
a goal, acceptance criteria that are observable, a definition of done, no open questions. When it
does not, say what is missing and offer [/refine-issue](../refine-issue/SKILL.md) — **an ambiguous
issue is never filled in by guessing.**

## Analyze

Only for an issue without tasks:

1. Read the code it touches firsthand before planning.
2. Hand the requirement to the `architect` agent. Its tasks — each with acceptance criteria, a
   definition of done and an assigned agent — become the plan, under these rules:
   - A task is a **reviewable step on the branch**: when its commits land, the branch builds and
     its tests pass.
   - Small, single-step work gets **no** tasks — implement the issue directly.
   - Work too big for one reviewable PR is not split into more tasks. Propose separate issues
     instead ([/create-issue](../create-issue/SKILL.md)), and implement only the one asked for.
3. Show the breakdown (one line of scope each) and ask for one round of feedback. Skip the round
   when the user said to go without questions.
4. Record the breakdown on the issue (a task list in its body or a comment) per TRACKER.md, or in
   the spec file.

## Pipeline

### 1. Set up

- Branch `<type>/<issue>-<slug>` per the [commit skill](../commit/SKILL.md); worktree
  `../juneau-<issue>` from `origin/main` per [WORKTREES.md](WORKTREES.md).
- A blocker whose PR is not merged yet: start from its pushed branch and open the PR with
  `--base <that branch>`, saying so in the PR body. A blocker with no branch → report blocked, STOP.
- **Resuming** — an existing branch (and PR) is continued in its worktree after
  `git pull --ff-only`. A task counts as done when its commits are on the branch.

Print the plan in one line: `#42: props → label + icon → story + docs`.

### 2. Each task, one after another

1. **Implement** in the worktree through the agent pipeline: `implementer` → `verifier` →
   `reviewer` (+ `security-agent`, `i18n-checker`, `test-reviewer` when they apply) → apply
   findings → `docs-keeper`. Give every agent the task, its definition of done, the branch and the
   absolute worktree path. Tests first; implement exactly this task.
2. **Commit** per the commit skill, footer `Refs: <issue>`. Push.
3. **Draft PR** — after the first task, `gh pr create --draft` with the [body](#pr-body). Later
   tasks update the body with `gh pr edit --body-file`.

A task that cannot be finished (spec gap, checks that stay red): commit nothing broken, comment
what blocks it on the issue, and STOP — later tasks may rest on it. Report `blocked`.

### 3. Ready and CI

After the last task: push, `gh pr ready`, then:

1. **Wait** — `gh pr checks <PR> --watch --interval 30` in the background. Green → step 4.
2. **Fix** — follow the [fix-pr](../fix-pr/SKILL.md) loop on this PR: read the log, classify,
   reproduce, fix through the agents, one new commit per fix.
3. **Give up** after **3 fix pushes**, or when the fix would exceed the issue's scope: comment on
   the issue which check fails and why, report `ci-red`.

### 4. Review comments

On every run for an issue whose PR is open. No per-thread approval: the user opted in by running
this skill. Fetch unresolved threads with
[address-pr-comments/QUERIES.md](../address-pr-comments/QUERIES.md); skip threads whose last comment
is ours. Every thread acted on ends with a reply — a reviewer must never find a thread silently
resolved:

| Thread                                                          | Do                                                    |
| --------------------------------------------------------------- | ----------------------------------------------------- |
| Concrete, correct ask within the issue's scope                  | Fix; reply `Fixed in <short sha>: <what>`; resolve    |
| Question the code or the spec answers                           | Reply with the answer; do not resolve                 |
| Bot suggestion that is wrong, already met or out of scope       | Reply with a one-line reason; resolve (bots only)     |
| Human ask that is out of scope, changes the spec, or you disagree with | Leave open — list it in the report for the user |

Order of one pass: fix everything, verify, commit, push — and only then reply and resolve, because
a reply names the commit, so the commit must exist on GitHub first. A push re-runs CI: back to
step 3.

## PR body

The commit skill's [PR body](../commit/PULL-REQUEST.md), with a task table in place of the summary:

```md
Closes #42

## Tasks

| Task                         | Commits   | What to verify                         |
| ---------------------------- | --------- | -------------------------------------- |
| `showCopyAction` prop        | `abc1234` | button only on assistant messages      |
| label, icon, story, README   | `def5678` | `cs` label, README tables              |

## Public API
- ...

## Test plan
- [ ] ...
```

A draft lists only the tasks done so far.

## After merge

The skill never merges. On each run: `gh pr view <PR> --json state,baseRefName,url`. Close out only
when `state` is `MERGED` **and** the base is `main` — a stacked PR waits until its base reaches
`main`. Then check the issue closed (via `Closes #N`; close it by hand only if it did not), and
clean up per [WORKTREES.md § Cleanup](WORKTREES.md#cleanup).

To pick up merges and new review threads without re-running by hand: `/loop 30m /implement-issue #42`.

## Final report

```
#42 Copy action on assistant messages — in review
  PR #57  ready, CI green, 2 fixed, 1 replied, 1 left for you   feat/42-copy-message-action
  task 1  abc1234
  task 2  def5678
```

Add the worktree when it is kept (`blocked`, `ci-red`), anything a reviewer must know (stacked
base, reruns, checks also red on `main`) and every thread left open, with its URL and why.

## Constraints

- NEVER mark the PR ready while a task in it is unfinished, unless the user says so.
- NEVER merge, force-push, amend pushed commits or `--no-verify`.
- NEVER resolve a thread without a reply on it, never resolve a human's thread you only replied
  to, and never dismiss a review.
- NEVER write to the tracker from a subagent, and never touch issues other than this one.
- NEVER change public API beyond what the issue asks for.
