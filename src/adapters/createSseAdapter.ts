import type { AiBackendAdapter, AiAdapterInput, AiStreamEvent, JuneauWireEvent } from '../core/types';
import { parseJuneauWire } from './parseJuneauWire';

/**
 * How to map a parsed SSE data payload to Juneau stream events.
 *
 * Return an array — most lines produce one event, but you can return multiple
 * or an empty array to skip a line entirely.
 */
export type SseEventParser = (data: string) => AiStreamEvent[];

/**
 * Options for createSseAdapter.
 */
export type SseAdapterOptions = {
  /**
   * HTTP method. Defaults to 'POST'.
   */
  method?: string;

  /**
   * Static headers merged with Content-Type. Use for auth tokens etc.
   * For dynamic headers (e.g. per-request auth), use getHeaders instead.
   *
   * @example { Authorization: 'Bearer sk-...' }
   */
  headers?: Record<string, string>;

  /**
   * Dynamic headers — called before every request with the current adapter input.
   * Merged on top of `headers`. Use this when the token is fetched at runtime.
   */
  getHeaders?: (input: AiAdapterInput) => Record<string, string> | Promise<Record<string, string>>;

  /**
   * Override the request body. By default sends `{ messages, context }`.
   * Return anything JSON-serialisable.
   */
  getBody?: (input: AiAdapterInput) => unknown;

  /**
   * Transform the message history before it is sent to the backend.
   * Called with the full `AiMessage[]` that would normally be sent and must
   * return the transformed array (or a promise of one).
   *
   * Use this to remap roles, filter messages, or convert to a backend-specific
   * schema without having to write a full custom adapter.
   *
   * @example
   * // Strip system messages before sending:
   * getMessages: (msgs) => msgs.filter(m => m.role !== 'system')
   *
   * @example
   * // Convert to Anthropic SDK message format:
   * getMessages: (msgs) => toSdkMessages(msgs)
   */
  getMessages?: (messages: AiAdapterInput['messages']) => AiAdapterInput['messages'] | Promise<AiAdapterInput['messages']>;

  /**
   * Credentials mode passed to fetch. Use `'include'` for cross-origin requests
   * that require cookies (e.g. session-based auth to a different domain).
   * Defaults to browser default (`'same-origin'`).
   *
   * @example
   * credentials: 'include'
   */
  credentials?: RequestCredentials;

  /**
   * Custom SSE line parser. Receives the raw string after `data: ` and returns
   * zero or more Juneau stream events.
   *
   * Defaults to an OpenAI-compatible parser that reads
   * `choices[0].delta.content` and handles `[DONE]`.
   *
   * @example
   * // For a backend that streams { text: "..." } JSON lines:
   * parseEvent: (data) => {
   *   const json = JSON.parse(data);
   *   return json.text ? [{ type: 'text', text: json.text }] : [];
   * }
   */
  parseEvent?: SseEventParser;
};

/**
 * Creates an adapter that connects to a **Server-Sent Events (SSE)** streaming
 * endpoint — the format used by OpenAI, Anthropic, and most AI backend proxies.
 *
 * The default parser understands OpenAI's streaming format out of the box.
 * Override `parseEvent` for any other SSE schema.
 *
 * @example
 * // OpenAI-compatible backend proxy — works with zero configuration:
 * const adapter = createSseAdapter('/api/chat');
 *
 * @example
 * // With auth header:
 * const adapter = createSseAdapter('/api/chat', {
 *   getHeaders: async () => ({
 *     Authorization: `Bearer ${await getToken()}`,
 *   }),
 * });
 *
 * @example
 * // Custom body shape:
 * const adapter = createSseAdapter('/api/chat', {
 *   getBody: ({ messages, context }) => ({
 *     messages,
 *     model: 'gpt-4o',
 *     stream: true,
 *     ...(context?.systemPrompt ? { system: context.systemPrompt } : {}),
 *   }),
 * });
 *
 * @example
 * // Custom SSE schema (backend streams { text: "..." }):
 * const adapter = createSseAdapter('/api/chat', {
 *   parseEvent: (data) => {
 *     try {
 *       const json = JSON.parse(data);
 *       return json.text ? [{ type: 'text', text: json.text }] : [];
 *     } catch {
 *       return [];
 *     }
 *   },
 * });
 */
export function createSseAdapter(url: string, options: SseAdapterOptions = {}): AiBackendAdapter {
  const {
    method = 'POST',
    headers: staticHeaders = {},
    getHeaders,
    getBody,
    getMessages,
    parseEvent = defaultOpenAiParser,
    credentials,
  } = options;

  return {
    async *sendMessage(input: AiAdapterInput): AsyncIterable<AiStreamEvent> {
      const dynamicHeaders = getHeaders ? await getHeaders(input) : {};

      const messages = getMessages ? await getMessages(input.messages) : input.messages;
      const resolvedInput: AiAdapterInput = { ...input, messages };

      const body = getBody
        ? getBody(resolvedInput)
        : { messages: resolvedInput.messages, context: resolvedInput.context };

      const response = await fetch(url, {
        method,
        credentials,
        headers: {
          'Content-Type': 'application/json',
          ...staticHeaders,
          ...dynamicHeaders,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const message = await response.text().catch(() => `HTTP ${response.status}`);
        yield { type: 'error', message: `Request failed (${response.status}): ${message}` };
        return;
      }

      if (!response.body) {
        yield { type: 'error', message: 'Response body is empty — server may not support streaming.' };
        return;
      }

      yield* readSseStream(response.body, parseEvent);
    },
  };
}

// ─── SSE stream reader ────────────────────────────────────────────────────────

async function* readSseStream(
  body: ReadableStream<Uint8Array>,
  parseEvent: SseEventParser,
): AsyncIterable<AiStreamEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE lines are separated by \n\n (double newline)
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? ''; // keep the incomplete last line

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue; // empty or SSE comment

        if (trimmed.startsWith('data: ')) {
          const data = trimmed.slice(6); // strip "data: "

          if (data === '[DONE]') {
            yield { type: 'done' };
            return;
          }

          const events = parseEvent(data);
          for (const event of events) {
            yield event;
            if (event.type === 'done' || event.type === 'error') return;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  yield { type: 'done' };
}

// ─── Default parser ───────────────────────────────────────────────────────────
//
// Tries Juneau wire protocol first. If the line looks like an OpenAI streaming
// response instead (choices[0].delta.content), falls back to that so the adapter
// works out of the box with OpenAI-compatible backends too.

const defaultOpenAiParser: SseEventParser = (data) => {
  if (!data || data === '[DONE]') return [];

  // Try Juneau wire protocol first
  const wire = parseJuneauWire(data);
  if (wire.length > 0) return wire;

  // Fallback: OpenAI chat completions streaming format
  try {
    const json = JSON.parse(data) as {
      choices?: Array<{ delta?: { content?: string | null }; finish_reason?: string | null }>;
      error?: { message?: string };
    };

    if (json.error?.message) {
      return [{ type: 'error', message: json.error.message }];
    }

    const delta = json.choices?.[0]?.delta;
    const finishReason = json.choices?.[0]?.finish_reason;

    if (finishReason === 'stop') return [{ type: 'done' }];
    if (delta?.content) return [{ type: 'text', text: delta.content }];

    return [];
  } catch {
    return [];
  }
};
