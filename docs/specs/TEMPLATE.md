# NNNN — Title in imperative mood

<!--
Copy to docs/specs/NNNN-short-slug.md (next free number). A spec is the single input an agent
implements from: if something is not written here, the agent asks instead of guessing.
Delete these comments when you fill it in.
-->

| | |
|---|---|
| Status | draft · ready · in progress · done |
| Issue | #N, or — |
| Branch | `<type>/<issue>-<slug>` once work starts |

## Goal

<!-- One or two sentences: what exists when this is done, and for whom. -->

## Context

<!-- Why now, what exists today (with file paths), what was considered and rejected. Short. -->

## Scope

- <!-- components, hooks, files this touches -->
- Out of scope: <!-- what is deliberately not part of this -->

## Public API

<!--
Every addition or change a consumer can see: props, hook options, exports, labels (en + cs),
tokens, data-juneau values, wire event types. Say whether each one is additive or breaking.
Write "none" when there is none.
-->

## Acceptance criteria

<!--
One observable behaviour per line, checkable without reading the code. Include the empty, error
and streaming cases where the happy path has them. Not implementation steps.
-->

- [ ] AC1 —
- [ ] AC2 —

## Tasks

<!--
Optional — filled in by the architect agent for work with more than one reviewable step. Each task
leaves the branch building and green. One line each, with the agent that takes it.
-->

## Definition of done

- [ ] Every acceptance criterion has a test, or a stated reason why it is checked manually
- [ ] `npm run typecheck` and `npx vitest run --project unit` green; `npm run build` green when exports changed
- [ ] README and CLAUDE.md describe the new behaviour; nothing they say is now stale
- [ ] <!-- only what this spec adds: a label in en + cs, a token in all three places, a story, … -->

## Open questions

<!-- One per line. A spec with an open question is not ready. Move each answer into the spec above. -->

---

## Definition of Ready

A spec is `ready` — and an agent may start — when:

1. The goal says what exists afterwards, not what to do.
2. Every acceptance criterion is observable and names one behaviour.
3. The Public API section is filled in, and each change is marked additive or breaking.
4. The definition of done lists what this spec needs beyond the defaults.
5. There are no open questions.
6. It fits in one reviewable pull request; otherwise it is split into several specs.
