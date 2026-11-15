# AGENTS.md — juneau

This file defines the rules and conventions for working in this repository.
Read it fully before making any changes.

---

## Project context

This library is being developed as a **bachelor's thesis** at a Czech university.
It is simultaneously intended for real-world use in a production application.

> **This dual-purpose nature is confidential.** The university prohibits being compensated for academic work. Do not reference the target application (Tappeer / insio-next), any client, or any commercial intent in code, comments, commit messages, or documentation.

The library must remain a **fully standalone, generic, open-source React/TypeScript library** with zero dependencies on any specific application, domain model, or business logic.

---

## Running the project

```bash
# Component development environment
npm run storybook       # http://localhost:6006

# Full demo app (two views: AI Dashboard + Sidebar Assistant)
npm run dev             # http://localhost:5200

# Type checking
npm run typecheck

# Tests
npm test
```

> **Important:** This machine has `omit=dev` set globally in npm config.
> Always install with `npm install --include=dev` to get devDependencies.

---

## Architecture

```
src/
  core/           # Types and stream utilities — no React, no side effects
  adapters/       # AiBackendAdapter implementations (mockAdapter, dashboardAdapter)
  hooks/          # useAiChat — state and streaming logic, no JSX
  components/     # UI components — presentation only, no adapter/hook logic
    AiChat/       # Headless chat body (message list + input + error), no chrome
    AiChatHeader/ # Shared header (brain icon + title + reset) used by all layouts
    AiSidebar/    # AiChatHeader + AiChat wrapped in sidebar chrome
    AiMessageList/
    AiMessageBubble/
    AiInput/
    AiTypingIndicator/
    AiError/
    JuneauProvider/
    parts/        # Message part renderers: AiTablePart, AiEntityCard, AiEntityListPart, AiProposalCard, AiMessagePartRenderer
  i18n/           # JuneauLabels type, context/hook, locales (en, cs)
  styles/         # tokens.css — single source of truth for all design tokens
  server/         # Node-only backend utilities — exported from juneau/server subpath
                  # toSdkMessages, createSkillSet, streamToWire, withToolRecovery
  demo/           # Demo app — not part of the public API, never exported
    views/        # DashboardView, SidebarView
```

**Layer rules — strictly enforced:**
- `core/` has no imports from any other local layer
- `adapters/` imports only from `core/`
- `hooks/` imports from `core/`, no JSX
- `components/` imports from `core/`, `hooks/`, and `i18n/`, no adapter logic
- `server/` imports only from `core/` and third-party packages (zod); no React, no JSX, no browser APIs
- `demo/` can import anything; it is never exported

### Key architectural distinction: AiChat vs AiSidebar

`AiChat` is the headless chat body — `AiMessageList + AiInput + AiError` in a flex column with no surrounding chrome. It accepts all state as props (no hook inside). The parent calls `useAiChat` and passes results down.

`AiSidebar` is `AiChatHeader + AiChat` wrapped in a fixed-width `<aside>` with a border. It owns `useAiChat` internally.

`AiChatHeader` is the shared header used by both `AiSidebar` and any custom layout (e.g. `DashboardView`). It reads `sidebarTitle` and `clearConversation` from `useLabels()` — change it once, both layouts update.

Both accept `aboveInput?: ReactNode` — a slot rendered between `AiMessageList`/`AiError` and `AiInput` inside a `data-juneau="above-input"` wrapper (`flex-shrink: 0`, full width). Omitted/null renders nothing, not even the wrapper. `AiSidebar` just forwards it, so it disappears with the chat body when minimized.

`AiChat` also accepts `centerInputWhenEmpty?: boolean` and `belowInput?: ReactNode`: with no messages, the empty state, error, `aboveInput`, input and `belowInput` stack in one centred column (`data-juneau="chat-start"`, `data-juneau="below-input"`); the first message restores the default layout and drops `belowInput`.

Use `AiChat` directly when you want chat embedded in your own layout (dashboard card, modal, full-page). Use `AiSidebar` when you want the pre-built panel.

---

## Dependencies

### Font Awesome

Icons are rendered via `@fortawesome/react-fontawesome` (free solid set). This is a production dependency — it is tree-shakeable and adds no global CSS requirements for the consumer.

Currently used icons: `faBrain` (AI avatar + header), `faPaperclip`, `faBolt`, `faPlus`, `faClockRotateLeft`, `faScroll`, `faPaperPlane` (input toolbar).

Do not use emoji characters as a substitute for icons anywhere in the component tree.

---

## Theming

Juneau uses CSS custom properties for all visual values, prefixed `--juneau-` to avoid collisions.

The default theme is **black + pink** (inspired by Tappeer's design system).

### JuneauProvider theme prop

```tsx
<JuneauProvider theme={{ colorPrimary: '#0f766e', colorAccent: '#14b8a6' }}>
  <AiSidebar adapter={myAdapter} />
</JuneauProvider>
```

Only keys you provide are overridden — everything else falls back to defaults. Overrides are scoped to the provider's DOM subtree.

**Every token in `tokens.css` must have a matching optional key in `JuneauTheme` and an entry in `buildThemeVars`** (JuneauProvider.tsx). When adding a token, update all three places.

### Styling hooks (`data-juneau` attributes)

Key elements carry stable `data-juneau` attributes (e.g. `data-juneau="message"`, `data-juneau="input-textarea"`, `data-juneau-role="user|assistant"`, `data-juneau-segment="bubble|card"`) so consumers can target them with plain CSS. Hashed CSS Module class names are **not** part of the public API — the attributes are. When adding a significant new element or component, give its root a `data-juneau` attribute and document it in the README table. Never rename or remove existing attribute values — they are a stability contract.

### Full token reference

#### Colors

| Token | Default | Usage |
|---|---|---|
| `--juneau-color-primary` | `#000000` | Primary actions, user bubble, chat header background |
| `--juneau-color-primary-dark` | `#252528` | Primary hover |
| `--juneau-color-primary-light` | `#ECECEC` | Primary tinted backgrounds |
| `--juneau-color-primary-border` | `#E8E8EC` | Primary tinted borders |
| `--juneau-color-accent` | `#FF49A4` | Chat header bg (sidebar), proposal confirm, assistant avatar |
| `--juneau-color-accent-dark` | `#FF6BB3` | Accent hover |
| `--juneau-color-accent-light` | `#FFF0F7` | Proposal card background |
| `--juneau-color-accent-border` | `#FFBDD9` | Proposal card border |
| `--juneau-color-surface` | `#FFFFFF` | Cards, sidebar, input background |
| `--juneau-color-surface-raised` | `#F4F4F6` | Page background, table headers, textarea |
| `--juneau-color-surface-hover` | `#ECECEC` | Row / item hover |
| `--juneau-color-border` | `#E8E8EC` | Default borders |
| `--juneau-color-border-subtle` | `#ECECEC` | Table row dividers |
| `--juneau-color-text-primary` | `#000000` | Main body text |
| `--juneau-color-text-secondary` | `#474747` | Supporting text |
| `--juneau-color-text-muted` | `#474747` | Labels, placeholders |
| `--juneau-color-text-faint` | `#9090A0` | Empty states, hints |
| `--juneau-color-text-inverse` | `#FFFFFF` | Text on dark/primary backgrounds |
| `--juneau-color-assistant-avatar` | `#FF49A4` | Assistant avatar circle background |
| `--juneau-color-error-bg` | `#FFF0F7` | Error banner background |
| `--juneau-color-error-border` | `#E6244A` | Error banner border |
| `--juneau-color-error-text` | `#C41A3B` | Error text |
| `--juneau-color-success-bg` | `#F4FDE8` | Success badge background |
| `--juneau-color-success-text` | `#3F7528` | Success badge text |
| `--juneau-color-warning-bg` | `#FFF6E5` | Warning badge background |
| `--juneau-color-warning-text` | `#B37400` | Warning badge text |
| `--juneau-color-danger-bg` | `#FFF0F7` | Danger badge background |
| `--juneau-color-danger-text` | `#C41A3B` | Danger badge text |

#### Radius, typography, motion

| Token | Default | Usage |
|---|---|---|
| `--juneau-radius-sm` | `6px` | Buttons, small elements |
| `--juneau-radius-md` | `8px` | Inputs, cards |
| `--juneau-radius-lg` | `12px` | Panels, large cards |
| `--juneau-radius-full` | `9999px` | Pills, avatars, dots |
| `--juneau-font-size-xs` | `11px` | Badges |
| `--juneau-font-size-sm` | `12px` | Labels, captions |
| `--juneau-font-size-base` | `13px` | Default body, action buttons |
| `--juneau-font-size-md` | `14px` | Chat bubbles |
| `--juneau-font-size-lg` | `15px` | Section headings |
| `--juneau-font-size-xl` | `16px` | App title |
| `--juneau-font-size-2xl` | `22px` | KPI values |
| `--juneau-font-size-3xl` | `24px` | Page titles |
| `--juneau-font-family` | system-ui stack | Font used across all components — override via `theme.fontFamily` |
| `--juneau-transition-fast` | `0.15s` | All transitions |

**Never use raw hex, rgb, or named colors in component CSS modules or inline styles — always reference a token.**

---

## i18n / Labels

All user-facing strings are collected in `JuneauLabels` and passed to `JuneauProvider` via the `labels` prop. Built-in locales: `juneauEn` (default) and `juneauCs`.

```tsx
import { juneauCs } from 'juneau';
<JuneauProvider labels={juneauCs}>...</JuneauProvider>
```

`labels` accepts `Partial<JuneauLabels>` — omitted keys fall back to `juneauEn`.

### Full label key reference

| Key | Used in |
|---|---|
| `sidebarTitle` | `AiChatHeader` title (sidebar + dashboard) |
| `clearConversation` | `AiChatHeader` reset button |
| `inputPlaceholder` | `AiInput` textarea |
| `sendMessage` | `AiInput` send button label + `aria-label` |
| `emptyStateText` | `AiMessageList` empty state |
| `emptyStateHint` | `AiMessageList` empty state hint |
| `proposalConfirm` | `AiProposalCard` fallback confirm label |
| `proposalCancel` | `AiProposalCard` fallback cancel label |
| `errorDismiss` | `AiError` dismiss button `aria-label` |
| `proposalConfirmed` / `proposalCancelled` / `proposalExpired` | `AiProposalCard` resolved-state badges |
| `historyEmpty` | `AiChatHistoryList` empty state |
| `historyDeleteChat` | `AiChatHistoryList` delete button `aria-label` |
| `actionAddFile` | `AiInput` quick action bar |
| `actionQuickActions` | `AiInput` quick action bar |
| `actionNew` | `AiInput` quick action bar |
| `actionHistory` | `AiInput` quick action bar |
| `actionRules` | `AiInput` quick action bar |

---

## useAiChat API

The primary hook. Returns:

| Member | Description |
|---|---|
| `messages` | Full `AiMessage[]` conversation history |
| `input` | Current textarea value |
| `setInput` | Set textarea value |
| `sendMessage()` | Send the current `input` value as a user message |
| `sendMessageWithText(text)` | Send a message programmatically without touching `input` state |
| `sendGreeting(contextHint)` | Trigger the adapter and stream a response as an **assistant-only** message — no user bubble shown. Use for proactive greetings on page load. |
| `isLoading` | `true` while streaming |
| `error` | Last error string, or `null` |
| `reset(nextMessages?)` | Clear all messages (or replace with a restored chat), abort any in-flight stream |
| `confirmProposal(id, payload)` | Marks the proposal `resolved: 'confirmed'` in state, then calls `onProposalConfirm` |
| `cancelProposal(id)` | Marks the proposal `resolved: 'cancelled'` in state, then calls `onProposalCancel` |

Options: `adapter`, `context?`, `onProposalConfirm?`, `onProposalCancel?`, `initialMessages?` (restored conversation), `historyLimit?` (max messages sent to the adapter per request — token saving; rendering is never trimmed and the cut never splits an exchange), `onMessagesChange?` (fires when the conversation settles — stream done, proposal resolved, reset; never per token — use to persist).

## AiChatProvider / AiChatContext

`AiChatProvider` wraps `useAiChat` in React context for a single persistent conversation across pages. It accepts all `useAiChat` options (including `initialMessages`, `historyLimit`, `onMessagesChange`) and forwards them — keep the two option lists in sync when adding hook options.

`setContext(obj)` **replaces** the whole context; the updater form `setContext(prev => ({ ...prev, key }))` merges. `useAiChatContext()` throws outside a provider (intentional); `AiChatContext` itself is exported from the barrel so consumers can `useContext(AiChatContext)` and handle `null` as a safe escape hatch.

## Chat history

Juneau is storage-agnostic: the consumer persists chats, Juneau defines the contract and re-renders restored conversations (all rich parts render from plain data — no reconstruction).

Helpers in `core/history.ts`:

| Export | Description |
|---|---|
| `serializeForStorage(messages)` | JSON-safe form: dates → ISO strings, unresolved proposals → `resolved: 'expired'`, `running` activity parts dropped |
| `deserializeMessages(stored)` | Revives dates; feed to `initialMessages` or `reset()` |
| `trimHistory(messages, limit)` | Keeps the most recent `limit` messages; never starts on an assistant turn |
| `trimChats(chats, limit)` | Returns the `limit` most recently updated `AiChatSummary[]`, newest first |

`AiChatHistoryList` renders `AiChatHistoryItem[]` (`{ id, title, updatedAt?, dateLabel? }`; an `AiChatSummary` fits, `dateLabel` wins over formatting `updatedAt`) with select/delete; the consumer owns the chat list and per-chat storage. Multi-chat switching = `reset(loadMessagesFor(chatId))`.

---

## Server utilities API (`juneau/server`)

Exported from the `/server` subpath — Node-only, never imported by browser code.

| Export | Description |
|---|---|
| `toSdkMessages(messages)` | Converts `AiMessage[]` to `CoreMessage[]` for ai-sdk. Fixes alternation, extracts text parts. |
| `createSkillSet(skills, options?)` | Returns `SkillSet` — ai-sdk `tools` + activity event buffer + `skills` + `calledSkillNames`. Auto-emits `running`/`done`/`failed` wire events. Skill `execute(input, { emit })` can push custom part wire events into the same buffer. Validates `tools?` references at startup — throws on unknown skill names. Skill metadata: `title`, `instructions?`, `readOnly?`, `requiresConfirmation?`, `tools?`. |
| `buildSkillIndex(skillSet)` | Compact one-liner-per-skill index string for the system prompt — `- name (read/write[, requires confirmation]): description`. |
| `selectSkills(skillSet, names)` | Concatenated `instructions` for the given skill names (typically `calledSkillNames` after phase 1) — lazy instruction loading for phase 3. |
| `streamToWire(fullStream, skillSet?, options?)` | Converts ai-sdk `fullStream` to Juneau wire SSE strings. Handles all v7 text chunk types (`text-delta` and `text`), drains activity buffer, emits `done`. `options.debug` logs every chunk. |
| `withToolRecovery(options)` | Multi-phase streaming: phase 1 with tools; phase 2 without tools (failure recovery) if a tool failed and no text was produced; optional phase 3 (silent-success recovery) if the tool succeeded but no text was produced — receives the full phase 1 message history (resolved from the ai-sdk result's `messages` promise, incl. tool-call + tool-result turns) so the model can summarise. Phase 2/3 errors surface as wire `error` events. `debug` logs all decision points and the resolved phase 3 history. |

Exported types: `SkillSet`, `SkillDefinition`, `SkillExecuteContext`, `SkillSetOptions`, `ToolRecoveryOptions`, `ToolRecoveryStreamResult`, `StreamToWireOptions`, `CoreMessage`.

### Custom part rendering

`AiMessagePart` includes `AiCustomPart` (`{ type: string; [key: string]: unknown }`) — consumer-defined part types flow through the wire protocol and message state untouched. `AiSidebar` and `AiChat` accept a `renderPart?: RenderPartFn` prop, threaded down through `AiMessageList` → `AiMessageBubble` → `AiMessagePartRenderer`. It is called before the built-in switch; a non-nullish return wins (can override built-ins). Juneau applies no validation or narrowing to custom parts — the consumer owns all type assertions. Unhandled custom parts render a dashed warning outline in dev, nothing in production.

---

## Code style

### General

- **No `any`** unless there is a documented reason in a comment directly above the usage.
- Prefer explicit types over inferred ones for function signatures and exported values.
- No default exports — use named exports everywhere.
- Keep files short. If a file exceeds ~150 lines, consider splitting it.
- No barrel `index.ts` files inside component folders — import directly from the file.

### Comments

Comment like a human. Only write a comment when the code itself cannot communicate the intent.

**Do comment:**
- Non-obvious architectural decisions ("We keep a ref here to avoid stale closures in the stream callback")
- Intentional workarounds or known limitations
- Public API contracts that aren't obvious from types alone

**Do not comment:**
- What the code is literally doing (`// increment counter`)
- Every function and variable as a matter of habit
- Storybook stories or obvious prop types

### React components

- One component per file.
- Props type defined locally in the same file, named `Props`.
- No business logic inside components — derive display values from props, nothing more.
- CSS Modules for all component styles. No inline styles except in Storybook decorators.

### Naming

- Components: `PascalCase`
- Hooks: `camelCase` prefixed with `use`
- Types and interfaces: `PascalCase`, prefix library types with `Ai` (e.g. `AiMessage`, `AiBackendAdapter`)
- CSS class names: `camelCase` in module files
- Constants: `SCREAMING_SNAKE_CASE` for true constants, `camelCase` for config objects

---

## No emojis in UI

Do not use emoji characters in any component, CSS, Storybook story, or demo that renders visible UI. Use Font Awesome icons or SVGs with proper `aria-label` attributes instead.

---

## Testing

Tests live in `src/**/*.test.ts(x)` alongside the code they test. Run with `npm test`.

### What to test

- **`core/` utilities** — `consumeStream`, `delay`, stream event sequencing.
- **`adapters/mockAdapter`** — correct events emitted per scenario.
- **`hooks/useAiChat`** — state transitions: message appended, text accumulates, error set, reset clears, `sendGreeting` produces no user bubble.

### What not to test

- Snapshot tests of rendered HTML.
- Storybook stories.
- CSS.
- The demo app.

### Style

- Use `vitest` and `@testing-library/react` for hook tests.
- Prefer `it('does X when Y')` over `test('X')`.
- No `describe` nesting deeper than one level.
- Assert behaviour, not implementation details.

---

## What this library must never contain

- Any import from `insio-next`, `tappeer`, or any other specific application
- Domain types: `Invoice`, `Budget`, `Supplier`, `Transaction`, etc.
- Real API keys or credentials of any kind
- Any call to a real AI API (OpenAI, Anthropic, etc.)
- Authentication logic
- GraphQL schemas or queries
- Backend/database code
