# Juneau

React component library for building AI chat interfaces. Streaming-first, adapter-based, fully themeable.

```tsx
import { JuneauProvider, AiSidebar, createSseAdapter } from 'juneau';
import 'juneau/dist/style.css';

const adapter = createSseAdapter('/api/chat');

<JuneauProvider>
  <AiSidebar adapter={adapter} />
</JuneauProvider>
```

---

## Install

```bash
npm install juneau
```

**Peer dependencies:** `react ^18 || ^19`, `react-dom ^18 || ^19`

---

## Core concept — the adapter

Juneau never calls any AI API directly. **You own the network layer.** Juneau provides the UI, state, and streaming machinery — you provide an adapter that connects it to your backend.

An adapter is just one method:

```ts
interface AiBackendAdapter {
  sendMessage(input: AiAdapterInput): AsyncIterable<AiStreamEvent>;
}
```

It receives the conversation history and streams back typed events:

```ts
type AiStreamEvent =
  | { type: 'text';  text: string }    // streamed text chunk — append to current bubble
  | { type: 'part';  part: AiTablePart | AiProposalPart | AiErrorPart } // rich UI block
  | { type: 'done' }                   // stream finished cleanly
  | { type: 'error'; message: string } // stream failed
```

This means your API keys stay on your backend, you control auth, rate limiting, model selection — Juneau just renders whatever comes back.

---

## Built-in adapters

Juneau ships two factory functions so you don't have to write boilerplate streaming code.

### `createSseAdapter(url, options?)` — recommended

For backends that stream **Server-Sent Events (SSE)** — the format used by OpenAI, Anthropic, and most AI API proxies.

The default parser understands OpenAI's streaming format out of the box (`choices[0].delta.content`).

```ts
import { createSseAdapter } from 'juneau';

// OpenAI-compatible backend — zero config needed:
const adapter = createSseAdapter('/api/chat');

// With dynamic auth header:
const adapter = createSseAdapter('/api/chat', {
  getHeaders: async () => ({
    Authorization: `Bearer ${await getSessionToken()}`,
  }),
});

// Custom request body:
const adapter = createSseAdapter('/api/chat', {
  getBody: ({ messages, context }) => ({
    messages,
    model: 'gpt-4o',
    stream: true,
    temperature: 0.7,
  }),
});

// Custom SSE event schema (backend streams { text: "..." } instead of OpenAI format):
const adapter = createSseAdapter('/api/chat', {
  parseEvent: (data) => {
    try {
      const json = JSON.parse(data);
      return json.text ? [{ type: 'text', text: json.text }] : [];
    } catch {
      return [];
    }
  },
});
```

| Option | Type | Default | Description |
|---|---|---|---|
| `method` | `string` | `'POST'` | HTTP method |
| `headers` | `Record<string, string>` | `{}` | Static headers, merged with Content-Type |
| `getHeaders` | `(input) => Record<string, string>` | — | Dynamic headers, called per request. Merged on top of `headers`. |
| `getBody` | `(input) => unknown` | `{ messages, context }` | Override request body |
| `parseEvent` | `(data: string) => AiStreamEvent[]` | OpenAI parser | Parse each `data: ...` SSE line into events |

---

### `createFetchStreamAdapter(url, options?)` — for non-SSE backends

For backends that stream **newline-delimited JSON (NDJSON)** or plain text — raw chunked HTTP without SSE formatting.

The default parser expects `{ "text": "..." }` or `{ "done": true }` JSON lines.

```ts
import { createFetchStreamAdapter } from 'juneau';

// NDJSON backend (streams { text: "..." } lines):
const adapter = createFetchStreamAdapter('/api/chat');

// Plain text — treat every chunk as raw text:
const adapter = createFetchStreamAdapter('/api/chat', {
  parseChunk: (chunk) => chunk ? [{ type: 'text', text: chunk }] : [],
});

// Custom JSON lines schema:
const adapter = createFetchStreamAdapter('/api/chat', {
  parseChunk: (chunk) => {
    try {
      const json = JSON.parse(chunk);
      if (json.error)  return [{ type: 'error', message: json.error }];
      if (json.done)   return [{ type: 'done' }];
      if (json.delta)  return [{ type: 'text', text: json.delta }];
      return [];
    } catch { return []; }
  },
});
```

| Option | Type | Default | Description |
|---|---|---|---|
| `method` | `string` | `'POST'` | HTTP method |
| `headers` | `Record<string, string>` | `{}` | Static headers |
| `getHeaders` | `(input) => Record<string, string>` | — | Dynamic headers, called per request |
| `getBody` | `(input) => unknown` | `{ messages, context }` | Override request body |
| `parseChunk` | `(chunk: string) => AiStreamEvent[]` | NDJSON parser | Parse each newline-delimited chunk into events |

---

### Writing your own adapter

If neither factory fits, implementing the interface directly takes about 10 lines:

```ts
import type { AiBackendAdapter } from 'juneau';

export const myAdapter: AiBackendAdapter = {
  async *sendMessage({ messages, context }) {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield { type: 'text', text: decoder.decode(value) };
    }

    yield { type: 'done' };
  },
};
```

---

### `mockAdapter` — for development

Shipped for local development. No backend needed — responds to keywords in the message:

| Say... | Gets you... |
|---|---|
| `"show"`, `"list"`, `"data"`, `"table"` | A rendered data table |
| `"suggest"`, `"recommend"`, `"proposal"` | A proposal card with confirm/cancel |
| `"help"`, `"what can you do"` | Capability overview |
| `"error"`, `"fail"` | Simulated error response |
| anything else | Explains the available triggers |

```ts
import { mockAdapter } from 'juneau';
<AiSidebar adapter={mockAdapter} />
```

---

## Components

### `<JuneauProvider>`

Wrap your app (or any subtree) once. Provides theme tokens and UI labels to all Juneau components below it.

```tsx
import { JuneauProvider, juneauCs } from 'juneau';

<JuneauProvider
  theme={{ colorPrimary: '#0f766e', colorAccent: '#14b8a6' }}
  labels={juneauCs}
>
  {children}
</JuneauProvider>
```

| Prop | Type | Description |
|---|---|---|
| `theme` | `JuneauTheme` | Override design tokens. Only specified keys are applied. |
| `labels` | `Partial<JuneauLabels>` | Override UI strings. Omitted keys fall back to English. |
| `className` | `string` | Added to the root `<div>`. |
| `style` | `CSSProperties` | Inline styles on the root `<div>`. |

---

### `<AiSidebar>`

The fastest path to a working chat UI. Self-contained — manages its own state internally via `useAiChat`.

```tsx
<AiSidebar
  adapter={adapter}
  title="AI Assistant"
  onProposalConfirm={(id, payload) => handleAction(id, payload)}
/>
```

| Prop | Type | Description |
|---|---|---|
| `adapter` | `AiBackendAdapter` | **Required.** Your adapter. |
| `title` | `string` | Overrides the `sidebarTitle` label for this instance. |
| `context` | `Record<string, unknown>` | Passed through to every `adapter.sendMessage` call. Useful for page-level context (current entity ID, user role, etc). |
| `icon` | `ReactNode` | Override the header + avatar icon. Defaults to a brain icon. |
| `actions` | `AiInputAction[]` | Toolbar buttons left of send. Pass `[]` to hide entirely. |
| `sendIcon` | `ReactNode` | Override the send button icon. |
| `onProposalConfirm` | `(id, payload) => void` | Called when user confirms a proposal card. |
| `onProposalCancel` | `(id) => void` | Called when user cancels a proposal card. |
| `className` | `string` | Added to the `<aside>` element. |
| `style` | `CSSProperties` | Inline styles on the `<aside>`. |

---

### `<AiChat>`

Headless chat body — message list + input bar + error banner, no surrounding chrome. Use this when you want to embed chat inside your own layout (dashboard panel, modal, full-page view).

The parent is responsible for calling `useAiChat` and passing results down as props.

```tsx
import { useAiChat, AiChat } from 'juneau';

function MyPage() {
  const chat = useAiChat({ adapter });

  return (
    <div className="my-layout">
      <MySidebar />
      <AiChat
        messages={chat.messages}
        input={chat.input}
        isLoading={chat.isLoading}
        error={chat.error}
        onInputChange={chat.setInput}
        onSend={chat.sendMessage}
        onStop={chat.stop}
        onProposalConfirm={chat.confirmProposal}
        onProposalCancel={chat.cancelProposal}
      />
    </div>
  );
}
```

| Prop | Type | Description |
|---|---|---|
| `messages` | `AiMessage[]` | Conversation history. |
| `input` | `string` | Current textarea value. |
| `isLoading` | `boolean` | Whether a stream is in progress. |
| `error` | `string \| null` | Last error message, or `null`. |
| `onInputChange` | `(value: string) => void` | Input change handler. |
| `onSend` | `() => void` | Send the current input. |
| `onStop` | `() => void` | Abort the in-flight stream. Renders a stop button while loading. |
| `onProposalConfirm` | `(id, payload) => void` | Proposal confirmed. |
| `onProposalCancel` | `(id) => void` | Proposal cancelled. |
| `assistantIcon` | `ReactNode` | Override the assistant avatar in all bubbles. |
| `actions` | `AiInputAction[]` | Toolbar buttons. |
| `sendIcon` | `ReactNode` | Override send button icon. |
| `placeholder` | `string` | Input placeholder text. |

---

## `useAiChat` hook

For full control over layout and behaviour. Returns everything needed to build a custom chat UI.

```ts
const {
  messages,            // AiMessage[] — full conversation history
  input,               // string — current textarea value
  setInput,            // (value: string) => void
  sendMessage,         // () => Promise<void> — sends current input as user message
  sendMessageWithText, // (text: string) => Promise<void> — send programmatically, no input state change
  sendGreeting,        // (contextHint: string) => Promise<void> — assistant speaks first, no user bubble shown
  stop,                // () => void — abort in-flight stream, keep existing messages
  isLoading,           // boolean — true while streaming
  error,               // string | null — last error, cleared on next send
  reset,               // () => void — clear all messages and abort any stream
  confirmProposal,     // (id: string, payload: unknown) => void
  cancelProposal,      // (id: string) => void
} = useAiChat({
  adapter,             // required
  context,             // optional — forwarded to every adapter.sendMessage call
  onProposalConfirm,   // optional — called by confirmProposal
  onProposalCancel,    // optional — called by cancelProposal
});
```

### Useful patterns

**Proactive greeting on mount (`sendGreeting`):**

`sendGreeting(hint)` sends the hint as a `system` role message to the adapter and streams the response as an assistant-only message — no user bubble is added to the conversation. Perfect for page-load summaries where the AI speaks first.

```ts
// In your component:
const chat = useAiChat({ adapter });

useEffect(() => {
  chat.sendGreeting(
    'The user is viewing the Invoices page. ' +
    'Briefly introduce what you can help with on this page.'
  );
}, []);
```

The hint arrives in your adapter as `input.messages[0]` with `role: 'system'`:

```ts
// In your adapter:
async *sendMessage({ messages }) {
  const systemMsg = messages.find(m => m.role === 'system');
  const hint = systemMsg ? getMessageText(systemMsg) : '';
  // → "The user is viewing the Invoices page. Briefly introduce…"

  // Forward to your backend / OpenAI system prompt:
  const res = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      messages: [{ role: 'system', content: hint }],
      stream: true,
    }),
  });
  // …stream response
}
```

**Trigger from outside the chat (e.g. clicking a data row):**
```ts
chat.sendMessageWithText(`Summarise order #${order.id} for me`);
```

**Pass page context to every request:**
```tsx
<AiSidebar
  adapter={adapter}
  context={{ pageId: 'invoices', entityId: invoice.id, userRole: 'admin' }}
/>
```

The `context` object lands in `input.context` inside every `adapter.sendMessage` call — use it to inject page-level data without polluting the message history.

**Reading message text in your adapter:**

Don't dig into `parts` manually — use the exported `getMessageText` helper:

```ts
import { getMessageText } from 'juneau';

async *sendMessage({ messages }) {
  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  const text = lastUser ? getMessageText(lastUser) : '';
  // → plain string, all text parts concatenated
}
```

**Auth — bearer token from React context:**
```ts
const adapter = createSseAdapter('/api/chat', {
  getHeaders: async () => ({
    Authorization: `Bearer ${await getAccessToken()}`,
  }),
});
```

**Auth — session cookie (no extra config needed):**

Cookies are sent automatically by `fetch` to same-origin URLs. Just use `createSseAdapter('/api/chat')` with no headers — the browser attaches the session cookie for you.

For cross-origin backends, add `credentials: 'include'` by writing a custom adapter:

```ts
const adapter: AiBackendAdapter = {
  async *sendMessage({ messages }) {
    const res = await fetch('https://api.example.com/chat', {
      method: 'POST',
      credentials: 'include',   // sends cookies cross-origin
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });
    // …stream response
  },
};
```

**Stop button feedback:**

When `onStop` is provided, the send button becomes a stop button while streaming. After the user hits stop, `isLoading` goes false immediately and the existing partial response stays visible in the conversation — there's no error state, the stream just ends cleanly where it was cut.

---

## Message parts

Assistant messages are composed of typed **parts**. Text is streamed chunk by chunk; rich UI blocks are emitted as complete `part` events.

| Part type | Emitted as | Rendered by |
|---|---|---|
| `text` | `{ type: 'text', text: string }` stream events, accumulated | Markdown via `react-markdown` — safe against XSS |
| `table` | `{ type: 'part', part: { type: 'table', ... } }` | `AiTablePart` |
| `proposal` | `{ type: 'part', part: { type: 'proposal', ... } }` | `AiProposalCard` |
| `error` | `{ type: 'error', message: string }` or `{ type: 'part', part: { type: 'error', ... } }` | Inline error in bubble |

**Emitting a proposal from your adapter:**
```ts
yield {
  type: 'part',
  part: {
    type: 'proposal',
    proposal: {
      id: 'confirm-delete',           // passed back to onProposalConfirm
      title: 'Delete this item?',
      description: 'This cannot be undone.',
      confirmLabel: 'Delete',         // optional, falls back to labels.proposalConfirm
      cancelLabel: 'Keep',            // optional, falls back to labels.proposalCancel
      payload: { itemId: 42 },        // anything — you get it back in onProposalConfirm
    },
  },
};
```

**Emitting a table:**
```ts
yield {
  type: 'part',
  part: {
    type: 'table',
    columns: ['Name', 'Amount', 'Status'],
    rows: [
      { Name: 'Item A', Amount: '$1,200', Status: 'Paid' },
      { Name: 'Item B', Amount: '$840',   Status: 'Pending' },
    ],
  },
};
```

---

## Theming

All visual values are CSS custom properties prefixed `--juneau-`. Override them via `JuneauProvider`:

```tsx
<JuneauProvider theme={{
  colorPrimary:  '#1d4ed8',
  colorAccent:   '#7c3aed',
  radiusLg:      '16px',
  fontFamily:    '"Inter", sans-serif',
}}>
```

Only keys you specify are overridden — everything else keeps its default. Overrides are scoped to the provider's subtree so multiple providers with different themes can coexist.

### Full theme reference

| Key | CSS variable | Default | Usage |
|---|---|---|---|
| `colorPrimary` | `--juneau-color-primary` | `#000000` | Send button, user bubble |
| `colorPrimaryDark` | `--juneau-color-primary-dark` | `#252528` | Primary hover state |
| `colorPrimaryLight` | `--juneau-color-primary-light` | `#ECECEC` | Primary tinted backgrounds |
| `colorAccent` | `--juneau-color-accent` | `#FF49A4` | Header bg, proposal confirm, avatar |
| `colorAccentDark` | `--juneau-color-accent-dark` | `#FF6BB3` | Accent hover |
| `colorAccentLight` | `--juneau-color-accent-light` | `#FFF0F7` | Proposal card background |
| `colorSurface` | `--juneau-color-surface` | `#FFFFFF` | Cards, sidebar, input background |
| `colorSurfaceRaised` | `--juneau-color-surface-raised` | `#F4F4F6` | Page background, table headers |
| `colorSurfaceHover` | `--juneau-color-surface-hover` | `#ECECEC` | Row hover |
| `colorBorder` | `--juneau-color-border` | `#E8E8EC` | Default borders |
| `colorTextPrimary` | `--juneau-color-text-primary` | `#000000` | Main body text |
| `colorTextSecondary` | `--juneau-color-text-secondary` | `#474747` | Supporting text |
| `colorTextMuted` | `--juneau-color-text-muted` | `#474747` | Labels, hints |
| `colorTextFaint` | `--juneau-color-text-faint` | `#9090A0` | Empty states |
| `colorTextInverse` | `--juneau-color-text-inverse` | `#FFFFFF` | Text on dark backgrounds |
| `colorAssistantAvatar` | `--juneau-color-assistant-avatar` | `#FF49A4` | Assistant avatar circle |
| `radiusSm` | `--juneau-radius-sm` | `6px` | Buttons, small elements |
| `radiusMd` | `--juneau-radius-md` | `8px` | Inputs, cards |
| `radiusLg` | `--juneau-radius-lg` | `12px` | Panels, large cards |
| `fontFamily` | `--juneau-font-family` | system-ui | Font used across all components |

---

## i18n / Labels

All UI strings are overridable. Built-in locales: `juneauEn` (default) and `juneauCs`.

```tsx
import { juneauCs } from 'juneau';
<JuneauProvider labels={juneauCs}>...</JuneauProvider>
```

Pass any `Partial<JuneauLabels>` — omitted keys fall back to English:

```tsx
<JuneauProvider labels={{ sidebarTitle: 'Ask AI', sendMessage: 'Send' }}>
```

### Full label reference

| Key | Default (EN) | Used in |
|---|---|---|
| `sidebarTitle` | `AI Assistant` | `AiChatHeader` title |
| `clearConversation` | `Clear conversation` | `AiChatHeader` reset button |
| `inputPlaceholder` | `Ask a question… (Enter to send)` | `AiInput` textarea |
| `sendMessage` | `Send message` | `AiInput` send button |
| `stopMessage` | `Stop` | `AiInput` stop button (while streaming) |
| `emptyStateText` | `How can I help you today?` | `AiMessageList` empty state |
| `emptyStateHint` | `Try: "Show me the data" or "Can you suggest something?"` | `AiMessageList` empty state hint |
| `proposalConfirm` | `Confirm` | `AiProposalCard` fallback confirm label |
| `proposalCancel` | `Cancel` | `AiProposalCard` fallback cancel label |
| `errorDismiss` | `Dismiss` | `AiError` dismiss button |
| `actionAddFile` | `Add file` | `AiInput` toolbar |
| `actionQuickActions` | `Quick actions` | `AiInput` toolbar |
| `actionNew` | `New` | `AiInput` toolbar |
| `actionHistory` | `History` | `AiInput` toolbar |
| `actionRules` | `Rules` | `AiInput` toolbar |

---

## Custom toolbar actions

The toolbar buttons left of the send button are fully configurable:

```tsx
<AiSidebar
  adapter={adapter}
  actions={[
    {
      icon: <MyAttachIcon />,
      label: 'Attach file',
      onClick: () => openFilePicker(),
    },
    {
      icon: <MyTemplatesIcon />,
      label: 'Templates',
      onClick: () => openTemplateMenu(),
    },
  ]}
/>

// Hide the toolbar entirely:
<AiSidebar adapter={adapter} actions={[]} />
```

Each action: `{ icon: ReactNode, label: string, onClick?: () => void }`

---

## Security

- **No API keys in the library** — all AI calls happen in your adapter, which calls your backend. Juneau never sees credentials.
- **XSS-safe markdown** — text parts are rendered via `react-markdown`, which never uses `dangerouslySetInnerHTML`. Malicious model output cannot inject scripts.
- **No data storage** — Juneau holds conversation state in React memory only. Nothing is persisted or sent anywhere by the library itself.

---

## License

MIT
