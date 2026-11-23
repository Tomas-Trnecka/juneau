# Commit message rules

Conventional Commits, as the history already uses them. The optional local
[commit-msg hook](../../../.githooks/commit-msg) checks the header. Derive the _why_ from the diff,
not from the file names.

```
<type>(<scope>): <subject>      ← header, max 100 chars, no trailing "."

<body>                          ← blank line before it, wrap at ~80 chars

<footer>                        ← blank line before it
```

**type** — one of: `feat` `fix` `docs` `style` `refactor` `perf` `test` `build` `ci` `chore`
`revert`. Pick by intent, not by folder: a new capability is `feat`; a test-only change is `test`;
dependency bumps are `chore`.

**scope** — the area of the library, optional:

| Scope      | For                                                   |
| ---------- | ----------------------------------------------------- |
| `core`     | `src/core/` — types, stream utilities, history        |
| `adapters` | `src/adapters/`                                       |
| `hooks`    | `src/hooks/`                                          |
| `ui`       | `src/components/`, `src/styles/`                      |
| `i18n`     | `src/i18n/`                                           |
| `server`   | `src/server/` — the `juneau/server` subpath           |
| `lib`      | packaging, entry points, build output                 |
| `release`  | a version bump on its own                             |

Omit the scope for a change that spans several areas.

**subject** — imperative mood, lowercase start, no period, says what changed for a consumer and is
understandable without opening the diff: `let the history list show a consumer-formatted date`,
not `update history`. When the commit also bumps `package.json`'s version, end the subject with it
in parentheses: `feat(ui): centre the input in an empty chat (0.16.0)`.

**body** — whenever the change is not self-evident. Say _why_, and what a consumer has to know.

**footer** — blank line first:

- `Refs: #42` (or `Refs: KEY-42` for another tracker) when the work belongs to an issue;
  `Closes #42` only in the PR body, so the issue closes on merge, not on push.
- `BREAKING CHANGE: <what breaks and the migration>` for an incompatible public API change.
- The `Co-Authored-By` trailer for agent-authored commits, per the running agent's instructions.

## Examples

```
fix(ui): use base accent for the proposal card title (0.13.1)
```

```
feat(ui): add a copy action to assistant messages

Users copy answers into other tools; selecting text inside a streamed
bubble is fiddly. The action is opt-in, so existing layouts are unchanged.

Refs: #42
```

```
chore: update dev dependencies
```
