# Issue templates

The same sections as a spec ([docs/specs/TEMPLATE.md](../../../docs/specs/TEMPLATE.md)), so an
issue can become a spec file and back without rewriting. In English.

## Title

Imperative, specific, no trailing period. It names the change, not the area:
`Add a copy action to assistant messages`, not `Messages`. A bug names the wrong behaviour:
`Typing indicator stays visible after an aborted stream`, not `Fix typing indicator`.

## Acceptance criteria

One observable behaviour per line, verifiable without reading the code, phrased so it can be
checked off. `- [ ] Clicking copy puts the message's text parts on the clipboard` — not
`- [ ] Code is clean`, not `- [ ] Refactor the bubble`. When the requirement does not support a
criterion, ask; do not write a plausible one.

## Feature

```md
## Goal

<one or two sentences: what exists when this is done, and for whom>

## Scope

- <components, hooks, files this touches>
- Out of scope: <what is deliberately not part of this>

## Public API

<new or changed props, options, exports, labels, tokens, data-juneau values — or "none">

## Acceptance criteria

- [ ] <observable behaviour, one per line>

## Definition of done

- [ ] tests including edge cases; typecheck and unit tests green
- [ ] README and CLAUDE.md updated
```

## Bug

```md
## Reproduction

Version: juneau@<x.y.z> · React <18|19> · <browser or Node version when it matters>

1. <step>
2. <step>

## Expected behaviour

<what should happen>

## Actual behaviour

<what happens, with the error message or wrong value verbatim>

## Scope

- <where the cause is, when known — otherwise "not yet known">

## Definition of done

- [ ] a regression test that fails without the fix
- [ ] typecheck and unit tests green
- [ ] README updated if documented behaviour changed
```

The regression test is not optional: a bug fixed without one comes back.

## Open questions

Optional, last, while something the work depends on is undecided:

```md
## Open questions

- <question, one per line>
```

An issue with an open question does not meet the Definition of Ready: move each answer into the
body, then delete the section.

## Parent

```md
## Goal

<two or three sentences>

## Tasks

- [ ] #<n> <title>
- [ ] #<n> <title>
```

No definition of done on a parent: it is done when its tasks are.
