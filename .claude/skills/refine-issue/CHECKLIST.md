# Refinement checklist

What [SKILL.md](SKILL.md) validates. The templates are in
[create-issue/TEMPLATES.md](../create-issue/TEMPLATES.md) — this file says how to judge an issue
against them.

❌ blocks the Definition of Ready · ⚠️ should be fixed · ✅ fine.

## Title

- ❌ empty, or names only an area (`Messages`, `Bug in input`)
- ⚠️ a feature not imperative (`Add…`, `Show…`, `Let…`)
- ⚠️ a bug names the fix instead of the wrong behaviour
- ⚠️ over ~80 characters, a trailing period, or contradicted by the body

## Type fit

- ⚠️ a bug describing work that was never done → feature; a feature describing shipped behaviour
  that broke → bug. Proposed, never applied without the user's yes.

## Template sections

| Type    | Required                                                                  |
| ------- | ------------------------------------------------------------------------- |
| feature | Goal, Scope, Public API, Acceptance criteria, Definition of done          |
| bug     | Reproduction, Expected behaviour, Actual behaviour, Scope, Definition of done |
| parent  | Goal, Tasks                                                               |

- ❌ a section missing, empty, or holding only placeholders (`<…>`)
- ❌ `## Open questions` with a question in it
- ⚠️ Scope without "Out of scope" where a reader could reasonably expect more
- ⚠️ Scope or Public API names a component, prop, export or file that does not exist (checked with
  Glob or Grep before it is claimed) and does not say it is new
- ⚠️ content outside the template — fold it into the right section, drop nothing still true

## Acceptance criteria

Each criterion, numbered as it stands:

- ❌ not observable — `works correctly`, `is fast`, `code is clean`
- ❌ an implementation step — `refactor the bubble`, `add a prop`, `write tests` (tests belong in the
  definition of done)
- ❌ depends on a value that is not stated — a label text, a default, a timeout, behaviour on
  failure → a question, never a filled-in value
- ⚠️ two behaviours in one line → split
- ⚠️ not a checkbox (`- [ ]`)
- ⚠️ contradicts what the code does today without saying the change is intended
- ⚠️ the edge case is missing where the happy path has one: empty conversation, streaming in
  progress, aborted stream, restored history, the prop omitted, a custom `renderPart`
- ⚠️ touches public API without saying whether the change is additive or breaking

## Definition of done

- ❌ missing
- ⚠️ the template's items dropped
- ❌ a bug without "a regression test that fails without the fix"
- Add only what this issue needs — a new label in `en` and `cs`, a token in all three places, a
  `data-juneau` attribute in the README table, a story — never a generic list.

## Size

- ⚠️ more than one reviewable PR, or more than ~8 criteria → propose a split, filed through
  `/create-issue <ref>`
- ⚠️ a dependency mentioned in the text but not linked

## Data safety

- ❌ a secret, token or API key in the title, body or a quoted log → propose a redacted wording
  and tell the user to rotate it; the edit history still holds the old text
- ⚠️ personal data in a pasted conversation or log → replace with a neutral example

## Bug

A bug someone can fix without asking the reporter. Missing items become questions.

| Item            | Where                         | ❌ / ⚠️ when                                                     |
| --------------- | ----------------------------- | ---------------------------------------------------------------- |
| Version         | first line of Reproduction    | ❌ missing — `juneau@x.y.z`                                      |
| Environment     | same line                     | ⚠️ missing where it matters — React 18/19, browser, Node, bundler |
| Steps           | numbered list                 | ❌ none; ⚠️ no starting state (which adapter, which props)        |
| Minimal example | in the steps or a link        | ⚠️ the bug depends on a setup nobody can rebuild                 |
| Frequency       | line in Reproduction          | ⚠️ unknown — `always` or `sometimes (N of M)`                    |
| Expected        | Expected behaviour            | ❌ missing, or only "should work"                                |
| Actual          | Actual behaviour              | ❌ missing; ⚠️ paraphrased instead of the error verbatim          |
| Regression      | line in Reproduction          | ⚠️ unknown — last working version, or "never worked" (then maybe a feature) |
| Cause           | Scope                         | ✅ "not yet known" is fine; a suspected file or commit is offered, marked as suspected |
| Regression test | Definition of done            | ❌ missing                                                       |

## Related issues

2–4 searches over the issue's key nouns (a component, a prop, an error text), open and closed. For
a bug, closed issues too: an earlier fix of the same behaviour is a regression.

| Found                                               | Proposed as                       |
| --------------------------------------------------- | --------------------------------- |
| asks for the same change or reports the same defect | duplicate — ask which one survives |
| must be done before or after this one               | `Blocked by` / `Blocks`           |
| an earlier fix this bug reopens                     | related, plus a note in Reproduction |
| same component, shared decision                     | related — only with a concrete reason |

Not candidates: the issue itself, its parent and tasks, issues already linked, issues that only
share a label. When unsure, show it as "possibly related" and let the user decide; never link on
a guess.
