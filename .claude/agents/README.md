# Subagents

Each `*.md` file here defines one Claude Code subagent. The folder is checked in, so every session
runs the same agents with the same model, tools and instructions.

A subagent is a separate session with its own context window, its own system prompt (the body of
the file) and a restricted tool set. The main session delegates a task, waits, and gets back only
the agent's final report — nothing the agent read or ran lands in the main context. That is the
point: long test output, wide code searches and review passes stay out of the conversation that
is steering the work.

## When an agent runs

Claude picks an agent by matching the task against the `description` in the frontmatter.
Descriptions that say "Use PROACTIVELY" are picked without being asked. To force a choice, name it:

```
use the architect agent to plan docs/specs/0001-copy-message-action.md
run the reviewer on the last commit
```

`/agents` in an interactive session lists them and lets you edit them.

## The agents

| Agent | Effort | Writes | Use it for |
|---|---|---|---|
| `architect` | high | plan only | Start of a larger or ambiguous task: tasks with acceptance criteria, a definition of done and an assigned agent each. |
| `spec-refiner` | high | the spec file | Turns a rough spec or issue into one that meets the Definition of Ready; open questions instead of guessed criteria. |
| `implementer` | medium | code | Clearly specified work from a spec: components, hooks, core utilities, server helpers, tests. |
| `test-writer` | medium | tests only | Behaviour tests for code that lacks them; reports a test that exposes a bug instead of pinning it. |
| `verifier` | low | nothing | Runs typecheck, unit tests (and build when relevant); returns only failures. |
| `reviewer` | high | nothing | Correctness and conformance review before a change counts as done. |
| `security-agent` | high | nothing | Changes to markdown/HTML rendering, URL handling, stream parsing, the server subpath or dependencies. |
| `i18n-checker` | low | nothing | After any label change: `en`/`cs` parity, README table, no hard-coded UI strings. |
| `test-reviewer` | high | nothing | New tests: mock-only assertions, snapshots, implementation coupling, tests that pin a bug. |
| `debugger` | xhigh | code | Bugs that survived a first fix or are hard to reproduce. Root cause first. |
| `docs-keeper` | medium | docs only | Before the commit: finds README / CLAUDE.md content the change made stale. |

**A strong checker over a weaker doer.** Every agent runs on the same model; the difference is
`effort`, the reasoning level. Routine implementation runs at medium, every correctness gate and
planning at high, debugging at xhigh, mechanical checks at low. The expensive mistakes are the ones
a reviewer misses, so that is where the thinking budget goes.

**Read-only checkers get no `Write`/`Edit` tool.** A reviewer that can edit will "helpfully" fix
what it found, and then nobody reviews the fix.

## The pipeline

```
spec ──► architect ──► implementer ──► verifier ──► reviewer ──► (findings applied) ──► docs-keeper ──► commit
                                                       │
                                                       ├─ security-agent   (rendering, parsing, deps)
                                                       ├─ i18n-checker     (labels changed)
                                                       └─ test-reviewer    (new tests)
                                          debugger  (a bug survived the first fix)
```

1. **Plan.** `architect` breaks the spec into tasks with a definition of done and names the agent
   for each. Small, unambiguous tasks skip this step.
2. **Implement.** One implementer per task, tests first.
3. **Verify.** `verifier` runs the checks. Failures go back to the implementer.
4. **Review.** `reviewer` always; the conditional checkers when their trigger applies. Independent
   checkers run in parallel. Findings are applied by the implementer, then re-verified.
5. **Document and commit.** `docs-keeper` runs last, before the commit.

## Rules for handing work to an agent

- **Give the whole context.** An agent does not see the conversation. Put the spec, the relevant
  file paths, the branch, the absolute worktree path and the definition of done into the prompt.
- **Every task has a definition of done.** A task without one goes back to `architect`.
- **Never let an agent guess.** An ambiguous or contradictory spec is escalated as a question,
  not filled in.
- **Exactly what was specified.** No extra features, no drive-by refactors.
- **Reports, not dumps.** An agent ends with what changed, which files, the commands it ran with
  their result, and what the reviewer should look at.

## Adding or changing an agent

```markdown
---
name: kebab-case-name            # how the agent is addressed
description: >-                  # what Claude matches the task against; say WHEN to use it
  ...
model: opus
effort: low | medium | high | xhigh   # reasoning level; omit for the session default
tools: Read, Grep, Glob          # omit for all tools; no Write/Edit for read-only agents
---

The system prompt. Second person, concrete, short. Point to CLAUDE.md for the rules instead of
copying them in.
```

- The `description` decides whether the agent is picked. Lead with the trigger, then the scope,
  then what it does not do.
- Give the smallest tool set that does the job.
- Keep the body under roughly 100 lines and link to CLAUDE.md for project rules — one source of
  truth.
- Try the agent on a real task before committing it. If its report shows it had to guess, the
  prompt is missing an instruction.
- Update the table above and, if the pipeline changed, the "Working with agents" section of
  CLAUDE.md.
