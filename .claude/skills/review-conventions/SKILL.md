---
name: review-conventions
description: Review the current branch or given files against Juneau's architectural rules and conventions in CLAUDE.md — layer rules, design tokens, labels, data-juneau attributes, component conventions, public API stability. Produces findings by severity and a batch fix summary. Use when the user says "review this", "check my code", "check conventions", or pastes code for review.
---

# Review against conventions

## Quick start

1. The user names files **or** review the branch diff:
   ```bash
   git diff main...HEAD          # only commits unique to this branch (merge-base diff)
   git log --oneline main...HEAD
   ```
   `main...HEAD` (three dots) diffs against the merge-base, so `main` updates merged into the
   branch are excluded — only the author's own changes are reviewed.
2. Read the changed files — understand intent before finding issues.
3. Walk the checklist below.
4. Output findings, then the batch fix summary.

The source of truth is `CLAUDE.md`. When this checklist and CLAUDE.md disagree, CLAUDE.md wins —
and the disagreement is itself a finding.

## Checklist

**Layers**
- [ ] `core/` imports nothing from another local layer
- [ ] `adapters/` imports only from `core/`
- [ ] `hooks/` imports only from `core/`, contains no JSX
- [ ] `context/` imports only from `core/` and `hooks/`
- [ ] `components/` imports only from `core/`, `hooks/`, `context/`, `i18n/`; no adapter logic
- [ ] `server/` has no React, no JSX, no browser APIs; imports only `core/` and third-party packages
- [ ] Nothing outside `demo/` imports from `demo/`

**Theming**
- [ ] No raw hex, `rgb()` or named colors in CSS Modules or inline styles — tokens only
- [ ] A new token exists in `tokens.css`, `JuneauTheme` and `buildThemeVars`

**Labels**
- [ ] No hard-coded user-facing string or `aria-label` in a component — `useLabels()`
- [ ] A new label exists in `JuneauLabels`, `en.ts`, `cs.ts` and the README table

**Styling hooks**
- [ ] A new significant element has a `data-juneau` attribute, documented in the README table
- [ ] No existing `data-juneau` value was renamed or removed

**Components**
- [ ] One component per file, local `Props` type, named exports, no barrel `index.ts` in the folder
- [ ] CSS Modules, no inline styles (except Storybook decorators)
- [ ] No business logic — display values derived from props only
- [ ] No emoji in UI; icons from `src/components/icons.tsx` with `aria-hidden` or an `aria-label`

**Types and code**
- [ ] No `any` without a comment directly above it
- [ ] Explicit types on exported functions and values
- [ ] Comments explain intent, not what the line does
- [ ] Files stay around ~150 lines or less

**Public API**
- [ ] New exports are intended and exported from the right entry (`src/index.ts` or `src/server/index.ts`)
- [ ] No breaking change to props, options, exports or wire format without it being called out
- [ ] A new `useAiChat` option is forwarded by `AiChatProvider`
- [ ] No new dependency

**Tests and docs**
- [ ] New behaviour has behaviour tests; no snapshots
- [ ] README / CLAUDE.md updated where behaviour or API changed

## Output format

For each finding:

```
[SEVERITY] Issue title

File: path/to/file.tsx  Line: X

Issue:  what is wrong
Source: CLAUDE.md § <section>
Fix:    concrete change
```

Severity: **HIGH** — a rule in CLAUDE.md violated or a public API break, must fix · **MEDIUM** —
convention or missing test/docs, should fix · **LOW** — suggestion.

## Batch fix summary (always last)

After all findings, one compact block ready to hand to the `implementer` agent:

```
## Batch fix summary

path/to/file.tsx (Lines X–Y)
- Issue: ...
- Fix: ...

Constraints: apply only these fixes; no unrelated changes; follow CLAUDE.md.
```

Omit the summary when there are no findings — and say the change is clean.
