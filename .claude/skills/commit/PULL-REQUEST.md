# Pull request title and body

## Title

```
<type>(<scope>): <short title>
```

Same type and scope rules as [COMMIT-MESSAGE.md](COMMIT-MESSAGE.md). Imperative mood, no trailing
period, whole title ≤ 70 characters. No issue reference in the title — it goes in the body.

## Inference

**Parse the branch name first.** Branches follow `<type>/<issue>-<slug>` or `<type>/<slug>`:

- `feat/42-copy-message-action` → type=`feat`, issue=`#42`, slug=`copy-message-action`
- `fix/sse-split-lines` → type=`fix`, issue=none
- Anything else (`wip`) → ask the user for an explicit type and title.

Use the branch type verbatim; override only when the commits clearly contradict it (a `feat/…`
branch holding only tests becomes `test`) and mention the override in the report. Start the title
from the slug, then refine it with the commit subjects so it reads as a sentence.

## Body

```
Closes #42

## Summary
- <1–3 bullets: what changed and why, from commit subjects and bodies>

## Public API
- <new or changed props, options, exports, labels, tokens, data-juneau values — or "none">

## Test plan
- [ ] <what a reviewer should verify>
```

- Group related commits into one bullet — never list every commit.
- Drop noise commits (`fix typo`, `wip`, `address review`, merges).
- Mention new tests in the test plan; otherwise propose realistic checks (a Storybook story, the
  demo app).
- Factual, no marketing language, no emoji.
