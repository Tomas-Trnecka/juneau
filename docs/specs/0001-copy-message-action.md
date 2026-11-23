# 0001 — Add a copy action to assistant messages

| | |
|---|---|
| Status | ready (example spec — demonstrates the template; not implemented) |
| Issue | — |
| Branch | `feat/copy-message-action` once work starts |

## Goal

Users can copy an assistant answer to the clipboard with one click, without selecting text inside
the bubble. Consumers opt in, so existing layouts do not change.

## Context

Today an answer can only be copied by selecting it by hand, which is fiddly while markdown tables
and lists are rendered. `AiMessageBubble` renders the parts of one message
(`src/components/AiMessageBubble/AiMessageBubble.tsx`); `AiChat` passes props to it through
`AiMessageList`, the same way `assistantIcon` and `renderPart` already travel. Rejected: a
consumer-side `renderPart` workaround — it can only replace parts, not add an action to the
message as a whole.

## Scope

- `AiMessageBubble`, `AiMessageList`, `AiChat`, `AiSidebar` (prop threading)
- `src/components/icons.tsx` (new icon), `src/i18n/` (two labels)
- Out of scope: copying user messages, copying card parts (tables, entities, proposals, custom
  parts) as rich content, a consumer callback on copy.

## Public API

All additive:

| Kind | Name | Notes |
|---|---|---|
| Prop | `showCopyAction?: boolean` on `AiChat` and `AiSidebar` | default `false`; forwarded through `AiMessageList` to `AiMessageBubble` |
| Label | `copyMessage` | en `Copy message` · cs `Kopírovat zprávu` — button `aria-label` and tooltip |
| Label | `messageCopied` | en `Copied` · cs `Zkopírováno` — announced after a successful copy |
| Styling hook | `data-juneau="copy-message"` | the button |
| Icon | `IconCopy` | internal, Font Awesome Free `copy`; added to the README icon attribution |

No new token: the button uses `--juneau-color-text-faint` and `--juneau-color-text-secondary` on
hover.

## Acceptance criteria

- [ ] AC1 — With `showCopyAction` omitted or `false`, no copy button renders anywhere.
- [ ] AC2 — With `showCopyAction`, each assistant message that has at least one text part shows one
      copy button below its content; user messages never show one.
- [ ] AC3 — While a message is still streaming (the last assistant message while `isLoading` is
      true), its copy button is not shown.
- [ ] AC4 — Clicking the button writes the message's text parts to the clipboard, joined by a blank
      line, without card parts.
- [ ] AC5 — After a successful copy the button's accessible label reads `messageCopied` for 2
      seconds, then returns to `copyMessage`.
- [ ] AC6 — If the clipboard write is rejected (or the Clipboard API is missing), nothing throws and
      the label stays `copyMessage`.
- [ ] AC7 — The button is keyboard-focusable and activates with Enter and Space.

## Tasks

1. `showCopyAction` threaded `AiChat`/`AiSidebar` → `AiMessageList` → `AiMessageBubble`; button,
   clipboard write, copied state; tests for AC1–AC7 — `implementer`
2. Labels in `JuneauLabels`, `en.ts`, `cs.ts`; `IconCopy`; Storybook story; README (prop, labels,
   `data-juneau` table, icon attribution) — `implementer`, then `i18n-checker` and `docs-keeper`

## Definition of done

- [ ] Every acceptance criterion has a test (clipboard mocked with `vi.spyOn`)
- [ ] `npm run typecheck` and `npx vitest run --project unit` green; `npm run build` green
- [ ] README and CLAUDE.md describe the prop, the labels and the styling hook
- [ ] Both labels in `en` and `cs`; `IconCopy` listed in the README icon attribution
- [ ] A Storybook story of an assistant message with the copy action

## Open questions

None.
