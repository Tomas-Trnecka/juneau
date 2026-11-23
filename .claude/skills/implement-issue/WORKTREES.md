# Worktrees

Every issue gets its own git worktree, `../juneau-<issue>` (`../juneau-42`; a spec without an issue:
`../juneau-<slug>`), so two pieces of work never share a working tree, an index or a branch. The
main checkout is never switched, edited or committed in: the maintainer's `npm run dev` or
Storybook runs from it in watch mode, so a branch switch there reloads their servers onto code they
did not ask for, and their own uncommitted work lives there.

## Creating the worktree

```bash
git fetch origin main
git worktree add --no-track -b <type>/<issue>-<slug> ../juneau-<issue> origin/main
npm --prefix ../juneau-<issue> ci --include=dev
```

- **Where** — a sibling directory, never inside the repo: Vitest, TypeScript and Storybook globs
  would pick up a second copy of `src/`.
- **`--no-track`** — without it the branch tracks `origin/main`, and a later `git push` targets
  the wrong ref. The branch gets its own upstream on the first `git push -u origin <branch>`.
- **Stacked work** — an issue whose blocker's PR is not merged yet starts from the blocker's pushed
  branch (`origin/<blocker-branch>`) instead of `origin/main`, and its PR targets that branch.
- **Resuming** — a branch that already exists is checked out without `-b`
  (`git worktree add ../juneau-<issue> <branch>`); a worktree that already holds it
  (`git worktree list`) is reused as is.
- **What a fresh worktree lacks** — `node_modules` (hence `npm ci`) and any gitignored local
  files. The Playwright browser cache is per user, not per checkout, so story tests work once
  Chromium is installed.

## Handing the work to agents

- The main session orchestrates: it starts each task's implementer as a background agent and runs
  the next pipeline step (verifier, reviewer, fixes, docs-keeper) as soon as the previous agent
  reports back.
- Every prompt names the **absolute worktree path**. The agent runs each command as
  `cd <worktree> && …`, addresses files by absolute path under it, and never touches the main
  checkout or another issue's worktree.
- The Agent tool's own `isolation: "worktree"` is not used for issue work: it creates its own
  branch name, and the branch must follow the naming above.

## What stays one-at-a-time

Several worktrees can run unit tests, typecheck and builds at the same time. These are shared:

| Resource                      | Why                                                         |
| ----------------------------- | ----------------------------------------------------------- |
| Tracker writes                | Only the main session writes, so two runs never race        |
| `npm run dev` (port 5200)     | Fixed port — start it from a worktree only with `--port`    |
| `npm run storybook` (port 6006) | Fixed port — `npx storybook dev -p <other>` in a worktree |
| `git push` to the same branch | One writer per branch                                       |

## Cleanup

Once the PR is merged into `main` and nothing is left in the worktree
(`git -C <worktree> status --short` is empty): `git worktree remove <worktree>`, then delete the
local branch (`git branch -D` only after the merge is confirmed). Work that stopped `blocked` or
`ci-red` keeps its worktree. Never remove a worktree that still has changes, and never with
`--force`. [clean-merged-branches](../clean-merged-branches/SKILL.md) does this in bulk.
