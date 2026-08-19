# Juneau Server Utilities

Server-side helpers exported from `juneau/server`. Eliminate the boilerplate every Juneau backend
consumer has to write themselves — history mapping, tool execution with activity streaming, and
tool failure recovery.

Import from the `/server` subpath (Node-only — keeps zod and server logic out of the browser bundle):

```ts
import { toSdkMessages, createSkillSet, streamToWire, withToolRecovery } from 'juneau/server';
```

---

## `toSdkMessages(messages)`

Converts Juneau's `AiMessage[]` to the `CoreMessage[]` format expected by ai-sdk's `streamText` / `generateText`.

```ts
function toSdkMessages(messages: AiMessage[]): CoreMessage[];

type CoreMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};
```

**What it does:**
- Extracts plain text from `parts` — joins all `type: "text"` parts in order
- Replaces activity-only assistant messages with `{ role: 'assistant', content: '…' }` so conversation alternation stays valid (models reject histories with two consecutive user turns)
- Injects a placeholder assistant turn between any two consecutive user messages as a safety net
- Filters out empty turns (unless they are a required alternation filler)

```ts
import { toSdkMessages } from 'juneau/server';

const result = streamText({
  model,
  messages: toSdkMessages(input.messages),
  system,
});
```

---

## `createSkillSet(skills, options?)`

Takes a map of skill definitions and returns a `SkillSet` — ai-sdk tool definitions with a built-in
activity event buffer. Each tool automatically emits `running`, `done`, and `failed` activity wire
events as it executes.

```ts
function createSkillSet(skills: Record<string, SkillDefinition>, options?: SkillSetOptions): SkillSet;
```

**`SkillDefinition`:**
```ts
interface SkillDefinition<TInput extends ZodType = ZodType> {
  description: string;
  input: TInput;                            // Zod schema — used as ai-sdk tool parameters
  labels: {
    running: { cs: string; en: string };
    done:    { cs: string; en: string };
    failed?: { cs: string; en: string };    // defaults to 'Nepodařilo se' / 'Failed'
  };
  execute: (input: z.infer<TInput>, context: SkillExecuteContext) => Promise<unknown>;
}

interface SkillExecuteContext {
  // Emits a custom part wire event ({ type: 'part', part }) into the same
  // buffer as activities — drained by streamToWire at the same points.
  // Available synchronously at any point during execution.
  emit: (part: { type: string; [key: string]: unknown }) => void;
}
```

**Emitting custom parts from a skill:**
```ts
execute: async ({ query }, { emit }) => {
  const inv = await db.findInvoice(query);
  // Streamed to the frontend immediately — rendered via the renderPart prop
  emit({ type: 'invoice-card', invoiceNumber: inv.number, amount: inv.total });
  return { found: 1, invoice: inv }; // returned to the model as the tool result
},
```

**`SkillSetOptions`:**
```ts
interface SkillSetOptions {
  language?: string;   // 'en' | 'cs' | any key present in your labels. Default: 'en'
  debug?: boolean;     // emit console.debug logs per skill execution. Default: false
}
```

**`SkillSet`:**
```ts
interface SkillSet {
  tools: Record<string, unknown>;   // pass directly to streamText({ tools })
  drainActivities(): string[];      // returns and clears buffered Juneau wire SSE strings
  hadFailure: boolean;              // true if any tool call threw during this invocation
  failureContext: string | null;    // human-readable error description for recovery prompts
}
```

**Example:**
```ts
import { createSkillSet } from 'juneau/server';
import { z } from 'zod';

const skillSet = createSkillSet({
  invoiceSearch: {
    description: 'Search invoices by number, supplier, date, or status.',
    input: z.object({
      query: z.string().optional(),
      status: z.enum(['paid', 'pending', 'overdue']).optional(),
    }),
    labels: {
      running: { cs: 'Vyhledávám faktury…', en: 'Searching invoices…' },
      done:    { cs: 'Faktury nalezeny',    en: 'Invoices found' },
      failed:  { cs: 'Vyhledávání selhalo', en: 'Search failed' },
    },
    execute: async ({ query, status }) => {
      return db.invoices.search({ query, status });
    },
  },
}, { language: 'cs' });

// Pass to streamText:
const result = streamText({ model, system, messages, tools: skillSet.tools, maxSteps: 1 });

// Yield buffered activity events before text chunks:
for (const event of skillSet.drainActivities()) {
  yield event;   // Juneau wire SSE string, e.g. `data: {"type":"activity",...}\n\n`
}
```

---

## `streamToWire(fullStream, skillSet?, options?)`

Converts ai-sdk's `fullStream` AsyncIterable into Juneau wire SSE strings. Handles chunk property
naming, activity flush timing, and the final `done` event.

```ts
function streamToWire(
  fullStream: AsyncIterable<unknown>,
  skillSet?: SkillSet,
  options?: StreamToWireOptions
): AsyncIterable<string>;
```

**What it handles internally:**
- `chunk.type === 'text-delta'` or `'text'` → reads `chunk.text` (ai-sdk v7) with fallback to `chunk.textDelta` (v6). Both chunk types are handled because ai-sdk v7 + Gemini may emit either in the same stream.
- Calls `skillSet?.drainActivities()` before each text chunk — activities appear before the text they precede
- Calls `skillSet?.drainActivities()` once more after the loop ends — catches activities from the last tool call when no text followed
- Emits `data: {"type":"done"}\n\n` when the stream finishes
- `options.debug` — when `true`, logs every chunk received from ai-sdk via `console.debug`, including type, content, drain counts, and yielded text. Never logs in production (default: `false`).

```ts
import { streamToWire } from 'juneau/server';

const result = streamText({ model, system, messages, tools: skillSet.tools, maxSteps: 2 });

for await (const chunk of streamToWire(result.fullStream, skillSet, { debug: true })) {
  res.write(chunk);
}
```

---

## `withToolRecovery(options)`

Encapsulates the two-phase streaming pattern needed when a tool fails and the model retries the
tool instead of writing a text response (observed with Gemini 2.5 Flash).

```ts
function withToolRecovery(options: ToolRecoveryOptions): AsyncIterable<string>;

interface ToolRecoveryOptions {
  phase1: () => ToolRecoveryStreamResult;
  phase2: (failureContext: string) => { fullStream: AsyncIterable<unknown> };
  phase3?: (messages: unknown[]) => { fullStream: AsyncIterable<unknown> };
  skillSet: SkillSet;
  debug?: boolean;
}

// Structural match for ai-sdk v7's StreamTextResult — pass the streamText()
// result directly, it satisfies this shape.
interface ToolRecoveryStreamResult {
  fullStream: AsyncIterable<unknown>;
  messages?: Promise<unknown[]>;                  // preferred — resolves to ALL turns incl. tool-result
  response?: Promise<{ messages?: unknown[] }>;   // fallback only — may miss tool-result turns
}
```

**Phase 1:** Stream with tools. Tracks whether any text was produced and whether a tool failure occurred.

**Phase 2:** Triggers only when `hadFailure && !textProduced` — calls the model again without tools,
injecting `failureContext` as an assistant message to force a text response.

**Phase 3 (silent-success recovery):** Triggers when the tool succeeded but the model emitted no text
(`!hadFailure && !textProduced`). Confirmed Gemini 2.5 Flash behaviour — the fullStream ends with
`tool-call → tool-result → finish-step → finish` and **no `text-delta` ever arrives**; Gemini treats
the tool call as its complete response. `withToolRecovery` resolves the full message history
(including tool-call and tool-result turns) from the consumed phase 1 result's **`messages`** promise
(ai-sdk v7 — resolves to all turns after the stream is consumed; `response.messages` is used only as
a fallback because it may resolve to an incomplete subset missing tool-result turns, which Gemini
rejects with "function call turn must come immediately after a user turn or after a function response
turn"). The resolved history is passed to `phase3`, which should call the model again **without
tools** so it is forced to summarise the tool result as text. If `phase3` is not provided, `done` is
emitted cleanly (previous behaviour).

**Error surfacing:** Errors thrown by phase 2 / phase 3 model calls are emitted as Juneau wire
`error` events — never swallowed into a silent `done`.

**Debug output:** `debug: true` logs which branch fires, the full resolved phase 3 message array
(so you can verify the tool-result turn is present), a warning when the resolved history contains
no tool-result turn, and any phase 2/3 failure with its error message.

**`debug`:** When `true`, logs phase start/complete, the `textProduced` and `hadFailure` values at each decision point, and whether phase 2 is triggered. Passes `debug` down to both `streamToWire` calls so chunk-level logs are also emitted.

```ts
import { toSdkMessages, createSkillSet, withToolRecovery } from 'juneau/server';

async function* streamResponse(messages, context) {
  const sdkMessages = toSdkMessages(messages);
  const system = buildSystemPrompt(context);
  const skillSet = createSkillSet(SKILL_DEFINITIONS, { language: context.language });

  for await (const chunk of withToolRecovery({
    phase1: () => streamText({
      model,
      system,
      messages: sdkMessages,
      tools: skillSet.tools,
      maxSteps: 2,
    }),
    phase2: (failureContext) => streamText({
      model,
      system,
      messages: [...sdkMessages, { role: 'assistant', content: failureContext }],
      // no tools — model must write text
    }),
    phase3: (fullMessages) => streamText({
      model,
      system,
      messages: fullMessages,
      // no tools — includes tool-call + tool-result turns, model summarises
    }),
    skillSet,
  })) {
    yield chunk;
  }
}
```

Returns `AsyncIterable<string>` — Juneau wire SSE strings including activities, text, and `done`.

---

## What stays in user-land

These are intentionally not part of Juneau:

- API keys and model selection
- System prompt content and page-level knowledge
- Skill `execute` implementations (actual DB / API calls)
- Auth and session handling on the HTTP endpoint
- Context injection (`accountId`, `page`, `language`, etc.)

---

## Export location

Exported from the `/server` subpath to keep zod and server-only code out of the browser bundle:

```ts
// package.json exports
{
  ".":        { "types": "./dist/index.d.ts",        "import": "./dist/index.js" },
  "./server": { "types": "./dist/server/index.d.ts", "import": "./dist/server/index.js" },
  "./dist/style.css": "./dist/style.css"
}
```

```ts
// src/server/index.ts
export { toSdkMessages } from './toSdkMessages';
export { createSkillSet } from './createSkillSet';
export { streamToWire } from './streamToWire';
export { withToolRecovery } from './withToolRecovery';
export type { SkillSet, SkillDefinition, SkillExecuteContext, SkillSetOptions, ToolRecoveryOptions, ToolRecoveryStreamResult, StreamToWireOptions, CoreMessage } from './types';
```
