# Juneau

React component library for building AI chat interfaces. Streaming-first, adapter-based, fully themeable.

```tsx
import { JuneauProvider, AiChatProvider, AiSidebar, createSseAdapter } from 'juneau';
import 'juneau/dist/style.css';

const adapter = createSseAdapter('/api/chat');

<JuneauProvider>
  <AiChatProvider adapter={adapter}>
    <App />
    <AiSidebar />
  </AiChatProvider>
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
  | { type: 'text';  text: string }       // streamed text chunk — append to current bubble
  | { type: 'part';  part: AiMessagePart } // rich UI block (table, entity, entity-list, proposal, activity, error)
  | { type: 'done' }                       // stream finished cleanly
  | { type: 'error'; message: string }     // stream failed
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

### Backend utilities — `juneau/server`

If your backend uses ai-sdk, Juneau ships server-side helpers that eliminate the boilerplate of history mapping, activity streaming, and tool failure recovery. Import from the `/server` subpath — zod stays out of the browser bundle.

```ts
import { toSdkMessages, createSkillSet, buildSkillIndex, selectSkills, selectSkillsById, withToolRecovery, withSkillDispatch } from 'juneau/server';
```

**Full integration in ~15 lines:**

```ts
import { toSdkMessages, createSkillSet, withToolRecovery } from 'juneau/server';
import { streamText } from 'ai';
import { z } from 'zod';

const skillSet = createSkillSet({
  search: {
    title: 'Record Search',
    description: 'Search for records.',
    instructions: 'Present results concisely. If cards are shown, write one sentence only.',
    input: z.object({ query: z.string() }),
    labels: {
      running: { en: 'Searching…',    cs: 'Vyhledávám…' },
      done:    { en: 'Results found', cs: 'Nalezeno' },
    },
    execute: async ({ query }) => db.search(query),
  },
}, { language: context.language });

for await (const chunk of withToolRecovery({
  phase1: () => streamText({ model, system, messages: toSdkMessages(input.messages), tools: skillSet.tools, maxSteps: 1 }),
  phase2: (ctx) => streamText({ model, system, messages: [...toSdkMessages(input.messages), { role: 'assistant', content: ctx }] }),
  skillSet,
})) {
  res.write(chunk);
}
```

#### `toSdkMessages(messages)`

Converts `AiMessage[]` to `CoreMessage[]` for ai-sdk. Extracts text from parts, fixes conversation alternation (no two consecutive user turns), filters empty turns.

#### `createSkillSet(skills, options?)`

Wraps skill definitions into ai-sdk `tools` with a built-in activity buffer. Each tool call automatically emits `running` / `done` / `failed` Juneau wire SSE strings — no manual activity handling needed.

`execute` receives a `SkillExecuteContext` as its second argument with an `emit(part)` callback — push custom part wire events into the stream alongside the activities, e.g. an invoice card widget the frontend renders via `renderPart`:

```ts
execute: async ({ query }, { emit }) => {
  const inv = await db.findInvoice(query);
  emit({ type: 'invoice-card', invoiceNumber: inv.number, amount: inv.total });
  return { found: 1, invoice: inv }; // returned to the model as the tool result
},
```

Emitted parts share the activity buffer and are drained by `streamToWire` at the same points — they appear in the stream in emit order, before the model's text response.

Skill metadata: `title` (human-readable name), `id` (numeric, required — chosen by the consumer, must be unique across the skill map; `createSkillSet` throws at startup on duplicates), `instructions?` (agent workflow text — lazily loaded via `selectSkills` / `selectSkillsById`), `readOnly?` (default `true`), `requiresConfirmation?` (default `false`), `tools?` (skill composition — validated at startup, `createSkillSet` throws on a reference to an unknown skill).

`SkillSet` members: `tools`, `skills`, `skillsById` (Map&lt;number, SkillDefinition&gt;), `calledSkillNames`, `calledSkillIds`, `drainActivities()`, `hadFailure`, `failureContext`.

`SkillSetOptions`: `language?` — selects label variant (`'en'` default). `debug?` — emit `console.debug` logs per skill execution (default: `false`).

#### `buildSkillIndex(skillSet)`

Generates a compact one-liner-per-skill index for the system prompt — registry-driven, so the prompt never drifts from the actual skills. Each line includes a numeric ID so the model can request skills by ID rather than by name:

```
[1] invoiceSearch (read): Find invoices by number, supplier, date, or status.
[2] invoiceApprove (write, requires confirmation): Approve an invoice.
```

#### `selectSkills(skillSet, skillNames)`

Returns concatenated `instructions` for the given skill names — typically `skillSet.calledSkillNames` after phase 1. Workflow instructions load lazily, only for skills the model actually used.

#### `selectSkillsById(skillSet, skillIds)`

Same as `selectSkills` but resolves by numeric ID — use with `skillSet.calledSkillIds` to avoid string comparisons entirely. Unknown IDs and skills without instructions are skipped silently.

#### `streamToWire(fullStream, skillSet?, options?)`

Converts ai-sdk `fullStream` to Juneau wire SSE strings. Handles all ai-sdk v7 text chunk types (`text-delta` and `text`), drains activity buffer at the right moment, emits `done` at the end. Pass `{ debug: true }` to log every chunk received from ai-sdk.

#### `withSkillDispatch(options)`

Deliberate 2-phase skill dispatch — the clean alternative to sending every skill's full instructions on every request.

**Phase 1:** stream with `buildSkillIndex` as the system prompt and thin tool definitions. The model picks a skill by calling a tool — `calledSkillIds` is populated as tools fire.

**Phase 2:** always runs when at least one skill was called. Receives the full workflow instructions for the called skills (via `selectSkillsById`) and the complete phase 1 message history including tool-call and tool-result turns. The model is called again without tools so it reads the instructions and produces a text response.

If no skill was called (model answered directly), the phase 1 text is emitted as-is and the stream ends cleanly — no phase 2 needed.

```ts
for await (const chunk of withSkillDispatch({
  phase1: () => streamText({
    model,
    system: buildSkillIndex(skillSet), // compact index: [1] search (read): ...
    messages: sdkMessages,
    tools: skillSet.tools,
    maxSteps: 1,
  }),
  phase2: (instructions, history) => streamText({
    model,
    system: instructions, // full workflow text for the chosen skill only
    messages: history,    // full phase 1 history incl. tool-call + tool-result
  }),
  skillSet,
  onFinish: ({ text }) => saveAssistantReply(text),
})) {
  res.write(chunk);
}
```

| Option | Type | Description |
|---|---|---|
| `phase1` | `() => ToolRecoveryStreamResult` | Phase 1 stream — model picks a skill via tool call |
| `phase2` | `(instructions, messages) => { fullStream }` | Phase 2 stream — model executes with full instructions |
| `skillSet` | `SkillSet` | The skill set used in phase 1 |
| `onFinish` | `({ text }) => void` | Called once before `done` with accumulated text. Not called on error paths. |
| `debug` | `boolean` | Log phase decisions to `console.debug`. Default: `false`. |

#### `withToolRecovery(options)`

Multi-phase pattern for Gemini-style tool calls. Phase 1 streams with tools. Phase 2 triggers only when a tool failed **and** no text was produced — it calls the model without tools and injects the failure context to force a text response. Phase 3 (optional) handles the silent-success case — Gemini 2.5 Flash often treats a successful tool call as its complete response and never writes text. When the tool succeeded but no text was produced, `phase3` receives the full phase 1 message history (resolved from the ai-sdk result's `messages` promise — includes tool-call and tool-result turns, which Gemini requires to accept the history) so a second model call without tools can summarise the result. Errors thrown by phase 2/3 are emitted as wire `error` events instead of a silent `done`. Pass `debug: true` to log phase decisions, the resolved phase 3 history, and the `textProduced` / `hadFailure` state at each decision point.

Pass `onFinish` to receive the assistant text accumulated across all phases — called exactly once, right before the final `done` event (never on error paths). Use it to persist the response server-side.

```ts
yield* withToolRecovery({
  phase1: () => streamText({ model, system, messages, tools: skillSet.tools, maxSteps: 2 }),
  phase2: (ctx) => streamText({ model, system, messages: [...messages, { role: 'assistant', content: ctx }] }),
  phase3: (fullMessages) => streamText({ model, system, messages: fullMessages }), // no tools — forced text
  skillSet,
  onFinish: ({ text }) => saveAssistantReply(text),
});
```

#### Type re-exports

The wire/message types shared with the client — `AiMessage`, `AiMessageRole`, `AiMessagePart`, `AiTextPart`, `AiSerializedMessage`, `AiStreamEvent`, `JuneauWireEvent` (and its member types) — are also re-exported from `juneau/server`, so backend code never needs to import from the client entry.

Server-only types: `SkillSet`, `SkillDefinition`, `SkillExecuteContext`, `SkillSetOptions`, `SkillDispatchOptions`, `ToolRecoveryOptions`, `ToolRecoveryStreamResult`, `StreamToWireOptions`, `CoreMessage`.

---

### Juneau wire protocol — for Juneau-compatible backends

If your backend is built specifically for Juneau (e.g. Tappeer), stream newline-delimited JSON where each line is one of these shapes. Both `createSseAdapter` and `createFetchStreamAdapter` parse this automatically — no custom `parseEvent` or `parseChunk` needed.

```ts
// Text chunk — appended to the current assistant bubble
{ "type": "text", "text": "Here is what I found:" }

// Activity — shows AI progress (skill selection, tool calls, etc.)
// Send the same `id` with a new status to update in-place
{ "type": "activity", "id": "skill-select", "title": "Selecting skill", "description": "Finding the best skill for this request.", "status": "running" }
{ "type": "activity", "id": "skill-select", "title": "Skill selected", "description": "Using Document Search.", "status": "done" }
{ "type": "activity", "id": "doc-search",   "title": "Searching document", "status": "running" }
{ "type": "activity", "id": "doc-search",   "title": "Document found", "description": "INV-2024-0894", "status": "done" }

// Rich block — table, entity, entity list, or proposal
{ "type": "part", "part": { "type": "table", "columns": ["Name", "Amount"], "rows": [...] } }
{ "type": "part", "part": { "type": "entity", "entityType": "invoice", "entity": { "id": "...", "title": "...", "subtitle": "...", "fields": [{ "label": "Status", "value": "Approved", "badge": "success" }] } } }
{ "type": "part", "part": { "type": "entity-list", "title": "3 results", "entities": [...] } }
{ "type": "part", "part": { "type": "proposal", "proposal": { "id": "...", "title": "..." } } }

// Stream finished cleanly
{ "type": "done" }

// Stream error — ends the stream
{ "type": "error", "message": "Something went wrong." }
```

**Activity `status` values:** `running` | `done` | `failed`

**Activity `id` behaviour:**
- With `id` — a later event with the same `id` updates the existing row in-place (running → done)
- Without `id` — each activity appends as a new timeline row

**Activity `metadata`** is an optional opaque object — not rendered by Juneau, available for logging or custom renderers. Use it for internal data (tool name, duration, skill ID) that should not be shown to the user.

`createSseAdapter` also retains OpenAI-format fallback parsing (`choices[0].delta.content`) so it works with both Juneau-compatible backends and standard OpenAI proxies.

---

### `mockAdapter` — for development

Shipped for local development. No backend needed — responds to keywords in the message:

| Say... | Gets you... |
|---|---|
| `"show"`, `"list"`, `"data"`, `"table"` | A rendered data table |
| `"suggest"`, `"recommend"`, `"proposal"` | A proposal card with confirm/cancel |
| `"entity"`, `"card"`, `"detail"`, `"find"` | An entity list + entity detail card |
| `"activity"`, `"progress"`, `"document"` | An activity timeline with running/done states |
| `"help"`, `"what can you do"` | Capability overview |
| `"error"`, `"fail"` | Simulated error response |
| anything else | Explains the available triggers |

```ts
import { mockAdapter } from 'juneau';
// Pass to AiChatProvider — see below
```

---

## Providers

### `<JuneauProvider>`

Wrap your app once. Provides theme tokens and UI labels to all Juneau components below it.

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

### `<AiChatProvider>`

Holds the shared conversation state. Wrap your app (or layout) once — any page can then render `<AiSidebar />` without losing conversation history on navigation.

```tsx
import { AiChatProvider } from 'juneau';

<AiChatProvider
  adapter={myAdapter}
  onProposalConfirm={(id, payload) => handleAction(id, payload)}
  onProposalCancel={(id) => handleDismiss(id)}
>
  <App />
</AiChatProvider>
```

| Prop | Type | Description |
|---|---|---|
| `adapter` | `AiBackendAdapter` | **Required.** Your adapter. |
| `context` | `Record<string, unknown>` | Initial context forwarded to every adapter call. Update per-page via `setContext()`. |
| `onProposalConfirm` | `(id, payload) => void` | Called when user confirms a proposal card. |
| `onProposalCancel` | `(id) => void` | Called when user cancels a proposal card. |
| `initialMessages` | `AiMessage[]` | Restored conversation to start with (see Chat history). |
| `historyLimit` | `number` | Max messages sent to the adapter per request. Rendering never trimmed. |
| `onMessagesChange` | `(messages) => void` | Called when the conversation settles. Use to persist. |

**Updating context per page:**

Use `setContext()` from `useAiChatContext()` to tell the AI where the user is on each page. The context is forwarded opaquely to every `adapter.sendMessage` call as `input.context`.

```tsx
import { useAiChatContext } from 'juneau';

function InvoicesPage() {
  const { setContext } = useAiChatContext();

  useEffect(() => {
    setContext({
      page: 'invoices',
      availableTools: ['search', 'export'],
      userRole: 'admin',
    });
  }, []);

  return <main>...</main>;
}
```

**Replace vs merge:** passing an object to `setContext` **replaces** the whole context. To keep existing keys (e.g. a `sessionId` set elsewhere) while updating others, use the updater form:

```tsx
setContext(prev => ({ ...prev, page: 'invoices' }));
```

**Consuming chat state outside a guaranteed provider:**

`useAiChatContext()` throws when called outside `<AiChatProvider>` — fail fast is right for components that require it. For components that may render outside the provider (e.g. during sign-out transitions), use `useAiChatContextSafe()`, which returns `null` instead of throwing:

```tsx
import { useAiChatContextSafe } from 'juneau';

function OptionalChatButton() {
  const chat = useAiChatContextSafe(); // AiChatContextValue | null
  if (!chat) return null;
  return <button onClick={() => chat.sendMessageWithText('Help')}>Ask AI</button>;
}
```

The context value is memoized — consumers re-render only when chat state actually changes, not on every provider render.

---

## Components

### `<AiSidebar>`

Fixed-position chat panel. Reads all state from the nearest `<AiChatProvider>` — renders wherever you place it, conversation persists across navigation.

The sidebar anchors to the bottom-right of the viewport and opens at 60% screen height by default. Users can minimize it to a compact header bar.

```tsx
<AiSidebar
  title="AI Assistant"
  height="70vh"
/>
```

| Prop | Type | Description |
|---|---|---|
| `title` | `string` | Overrides the `sidebarTitle` label for this instance. |
| `icon` | `ReactNode` | Override the header + avatar icon. Defaults to a wand icon. |
| `actions` | `AiInputAction[]` | Toolbar buttons left of send. Pass `[]` to hide entirely. |
| `sendIcon` | `ReactNode` | Override the send button icon. |
| `height` | `string` | Height when open. Any CSS value. Defaults to `'60vh'`. |
| `className` | `string` | Added to the `<aside>` element. |
| `style` | `CSSProperties` | Inline styles on the `<aside>`. |
| `renderPart` | `RenderPartFn` | Custom part renderer — see below. |
| `onEntityClick` | `(entity, entityType?) => void` | Makes entity cards clickable — e.g. navigate to the record. |
| `headerActions` | `ReactNode` | Extra controls in the header, left of reset/minimize. Rendered as given — Juneau never interprets them. |

**Header chrome (`headerActions`):**

The header exposes a slot for consumer-owned controls — a settings button, a link, anything. Juneau renders the node untouched and owns none of its behaviour:

```tsx
<AiSidebar
  headerActions={
    <button onClick={() => setSettingsOpen(true)} aria-label='Chat settings'>
      ⚙
    </button>
  }
/>
```

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
| `renderPart` | `RenderPartFn` | Custom part renderer — see below. |
| `onEntityClick` | `(entity, entityType?) => void` | Makes entity cards clickable — e.g. navigate to the record. |

---

## Custom part rendering — `renderPart`

Both `AiSidebar` and `AiChat` accept a `renderPart` prop — an escape hatch for rendering consumer-defined part types (or overriding built-in ones):

```ts
type RenderPartFn = (part: AiMessagePart) => ReactNode | null | undefined;
```

It is called **before** the built-in renderers for every message part. Return a ReactNode to render it; return `null`/`undefined` to fall through to the built-ins (`text`, `table`, `entity`, `entity-list`, `proposal`, `activity`, `error`).

The backend can stream any custom part through the standard wire protocol:

```json
{ "type": "part", "part": { "type": "invoice-card", "invoiceNumber": "23251", "amount": "1200.00" } }
```

`AiCustomPart` (`{ type: string; [key: string]: unknown }`) is part of the `AiMessagePart` union, so TypeScript accepts custom shapes on both ends. Juneau applies **no validation or narrowing** to custom parts — the consumer owns all type assertions:

```tsx
// Define your part type wherever you like — Juneau doesn't need to know about it
type InvoiceCardPart = { type: 'invoice-card'; invoiceNumber: string; amount: string };

<AiSidebar renderPart={part => {
  if (part.type === 'invoice-card') return <InvoiceCard part={part as InvoiceCardPart} />;
  return null; // everything else falls through to the built-ins
}} />
```

Unhandled custom part types show a dashed warning outline in development (so they're never a silent mystery) and render nothing in production.

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
  isConnecting,        // boolean — true from send until first token arrives
  error,               // string | null — last error, cleared on next send
  reset,               // (nextMessages?: AiMessage[]) => void — clear (or replace) messages, abort any stream
  confirmProposal,     // (id: string, payload: unknown) => void — marks proposal resolved + fires callback
  cancelProposal,      // (id: string) => void — marks proposal resolved + fires callback
} = useAiChat({
  adapter,             // required
  context,             // optional — forwarded to every adapter.sendMessage call
  onProposalConfirm,   // optional — called by confirmProposal
  onProposalCancel,    // optional — called by cancelProposal
  initialMessages,     // optional — restored conversation to start with (see Chat history)
  historyLimit,        // optional — max messages sent to the adapter per request (token saving)
  onMessagesChange,    // optional — called when the conversation settles; use to persist
});
```

## `useAiChatContext` hook

Reads the shared state from `<AiChatProvider>`. Includes everything from `useAiChat` plus `setContext()`.

```ts
const {
  // all useAiChat fields +
  setContext,  // (ctx: Record<string, unknown>) => void — update context forwarded to adapter
} = useAiChatContext();
```

Throws a descriptive error if called outside `<AiChatProvider>`.

---

### Useful patterns

**Proactive greeting on mount (`sendGreeting`):**

`sendGreeting(hint)` sends the hint as a `system` role message to the adapter and streams the response as an assistant-only message — no user bubble is added to the conversation. Perfect for page-load summaries where the AI speaks first.

```ts
const { sendGreeting } = useAiChatContext();

useEffect(() => {
  sendGreeting(
    'The user is viewing the Invoices page. ' +
    'Briefly introduce what you can help with on this page.'
  );
}, []);
```

**Trigger from outside the chat (e.g. clicking a data row):**
```ts
const { sendMessageWithText } = useAiChatContext();
sendMessageWithText(`Summarise order #${order.id} for me`);
```

**Pass page context to every request:**
```tsx
const { setContext } = useAiChatContext();

useEffect(() => {
  setContext({ pageId: 'invoices', entityId: invoice.id, userRole: 'admin' });
}, [invoice.id]);
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
| `entity` | `{ type: 'part', part: { type: 'entity', ... } }` | `AiEntityCard` |
| `entity-list` | `{ type: 'part', part: { type: 'entity-list', ... } }` | `AiEntityListPart` |
| `proposal` | `{ type: 'part', part: { type: 'proposal', ... } }` | `AiProposalCard` |
| `activity` | `{ type: 'part', part: { type: 'activity', ... } }` | `AiActivityPart` |
| `error` | `{ type: 'error', message: string }` or `{ type: 'part', part: { type: 'error', ... } }` | Inline error in bubble |

**Emitting an activity from your adapter:**

Activity parts show the user what the AI is doing while it works — skill selection, document search, tool calls, etc. They have three states: `running`, `done`, `failed`.

```ts
// Show a running activity
yield {
  type: 'part',
  part: {
    type: 'activity',
    id: 'doc-search',           // optional stable ID — enables in-place update
    title: 'Searching document',
    description: 'Looking up document by ID.',
    status: 'running',
  },
};

// Later: update the same activity in-place (same id)
yield {
  type: 'part',
  part: {
    type: 'activity',
    id: 'doc-search',
    title: 'Document found',
    description: 'Found document INV-2024-0894.',
    status: 'done',
  },
};
```

If `id` is provided, a later activity part with the same `id` updates the previous one in-place instead of appending a new row. Without `id`, activity parts append as a timeline.

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

**Emitting an entity or entity list:**

Entity parts render structured records as cards — a title, optional subtitle, and labelled field rows. Field values can render as badges (`success` / `warning` / `danger` / `neutral`). Pass `onEntityClick` to `AiSidebar` / `AiChat` to make the cards clickable (e.g. navigate to the record); `entityType` and `entity.payload` are forwarded so consumers can route without guessing.

```ts
// Single entity card
yield {
  type: 'part',
  part: {
    type: 'entity',
    entityType: 'invoice',           // optional kind — forwarded to onEntityClick and custom renderers
    entity: {
      id: 'inv-0894',                // forwarded to onEntityClick
      title: 'INV-2024-0894',
      subtitle: 'DataSys a.s.',
      fields: [
        { label: 'Amount', value: 'CZK 390 000' },
        { label: 'Status', value: 'Approved', badge: 'success' },
      ],
      payload: { internalId: 42 },   // anything — not rendered, available in onEntityClick
    },
  },
};

// List of entities with an optional heading
yield {
  type: 'part',
  part: {
    type: 'entity-list',
    title: '2 results',
    entityType: 'invoice',
    entities: [
      { id: 'inv-1', title: 'INV-2024-0894', fields: [{ label: 'Status', value: 'Approved', badge: 'success' }] },
      { id: 'inv-2', title: 'INV-2024-0895', fields: [{ label: 'Status', value: 'Pending', badge: 'warning' }] },
    ],
  },
};
```

For fully custom entity layouts, override the built-in card via `renderPart` — return your own component for `part.type === 'entity'` / `'entity-list'` and it wins over the default renderer.

---

## Chat history

Juneau is storage-agnostic: it defines the exact data contract and renders restored conversations (including tables, proposals, and custom parts), but never touches storage itself. You persist chats wherever you want — localStorage, a database — and hand Juneau plain data.

**Persist a conversation:**

```tsx
import { useAiChat, serializeForStorage } from 'juneau';

const chat = useAiChat({
  adapter,
  historyLimit: 20, // send at most 20 messages to the adapter per request (token saving)
  onMessagesChange: (messages) => {
    // called when the conversation settles — never per streamed token
    localStorage.setItem('chat', JSON.stringify(serializeForStorage(messages)));
  },
});
```

`serializeForStorage` prepares messages for persistence:
- `createdAt` dates become ISO strings
- unresolved proposals are marked `resolved: 'expired'` — a restored proposal card renders disabled and can never fire callbacks against a stale payload
- `running` activity parts are dropped (they'd look permanently stuck)
- each message is stamped with the format version (`v: 1`); `deserializeMessages` treats a missing `v` as v1, so pre-versioned histories still parse

**Restore a conversation:**

```tsx
import { deserializeMessages } from 'juneau';

const stored = JSON.parse(localStorage.getItem('chat') ?? '[]');
const chat = useAiChat({ adapter, initialMessages: deserializeMessages(stored) });
```

All rich parts re-render exactly as they streamed in — no reconstruction needed. The restored history is also sent to the adapter, so the AI keeps full context.

**Rendering trims nothing.** `historyLimit` only caps what is *sent to the adapter*; the cut keeps the most recent messages and never splits a user/assistant exchange, so alternation stays valid.

**Multiple chats:**

Juneau supports a multi-chat UX via `AiChatSummary` and the `AiChatHistoryList` component. You own the chat list and per-chat storage; Juneau renders the list and switches conversations via `reset(nextMessages)`:

```tsx
import { AiChatHistoryList, trimChats } from 'juneau';

<AiChatHistoryList
  chats={trimChats(myChats, 10)}   // keep the 10 most recently updated
  activeChatId={currentChatId}
  onSelect={(chatId) => chat.reset(loadMessagesFor(chatId))}
  onDelete={(chatId) => deleteChat(chatId)}  // optional — omit to hide delete buttons
/>
```

```ts
type AiChatSummary = {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
};
```

`trimChats(chats, limit)` returns the `limit` most recently updated chats (sorted newest first) — delete the rest from your storage to enforce an overall chats limit.

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
| `minimizeSidebar` | `Minimize` | `AiChatHeader` minimize button |
| `expandSidebar` | `Expand` | `AiChatHeader` expand button (when minimized) |
| `inputPlaceholder` | `Ask a question… (Enter to send)` | `AiInput` textarea |
| `sendMessage` | `Send message` | `AiInput` send button |
| `stopMessage` | `Stop` | `AiInput` stop button (while streaming) |
| `emptyStateText` | `How can I help you today?` | `AiMessageList` empty state |
| `emptyStateHint` | `Try: "Show me the data" or "Can you suggest something?"` | `AiMessageList` empty state hint |
| `proposalConfirm` | `Confirm` | `AiProposalCard` fallback confirm label |
| `proposalCancel` | `Cancel` | `AiProposalCard` fallback cancel label |
| `proposalConfirmed` | `Confirmed` | `AiProposalCard` badge after confirm |
| `proposalCancelled` | `Cancelled` | `AiProposalCard` badge after cancel |
| `proposalExpired` | `No longer available` | `AiProposalCard` badge for restored proposals |
| `errorDismiss` | `Dismiss` | `AiError` dismiss button |
| `historyEmpty` | `No previous chats` | `AiChatHistoryList` empty state |
| `historyDeleteChat` | `Delete chat` | `AiChatHistoryList` delete button |
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
<AiSidebar actions={[]} />
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

---

## Icon attribution

Icons used internally by Juneau are from [Font Awesome Free](https://fontawesome.com) (v6), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). SVG paths are inlined directly — no runtime dependency on the Font Awesome package.

Icons used: `crow`, `paper-plane`, `paperclip`, `bolt`, `plus`, `clock-rotate-left`, `scroll`, `arrow-rotate-left`, `window-minimize`, `window-restore`.
