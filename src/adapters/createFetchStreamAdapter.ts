import type { AiBackendAdapter, AiAdapterInput, AiStreamEvent } from '../core/types';

/**
 * How to map a raw text chunk from the response body to Juneau stream events.
 *
 * Return an array — a chunk may produce one event, multiple, or none (empty array to skip).
 * The chunk is whatever the server sent — could be a full JSON line, a partial one,
 * or plain text depending on your backend.
 */
export type FetchChunkParser = (chunk: string) => AiStreamEvent[];

/**
 * Options for createFetchStreamAdapter.
 */
export type FetchStreamAdapterOptions = {
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
   * How to parse each chunk from the response stream into Juneau events.
   *
   * Defaults to a newline-delimited JSON (NDJSON) parser that expects each
   * line to be either `{ text: "..." }` or `{ done: true }`.
   *
   * @example
   * // Plain text streaming — treat every chunk as raw text:
   * parseChunk: (chunk) => chunk ? [{ type: 'text', text: chunk }] : []
   *
   * @example
   * // Custom JSON lines format:
   * parseChunk: (chunk) => {
   *   try {
   *     const json = JSON.parse(chunk);
   *     if (json.error) return [{ type: 'error', message: json.error }];
   *     if (json.done) return [{ type: 'done' }];
   *     if (json.delta) return [{ type: 'text', text: json.delta }];
   *     return [];
   *   } catch { return []; }
   * }
   */
  parseChunk?: FetchChunkParser;
};

/**
 * Creates an adapter that connects to a **raw chunked HTTP streaming** endpoint —
 * for backends that stream newline-delimited JSON (NDJSON) or plain text,
 * rather than SSE.
 *
 * Use `createSseAdapter` instead if your backend streams Server-Sent Events
 * (the format used by OpenAI, Anthropic, and most AI APIs).
 *
 * @example
 * // NDJSON backend streaming { text: "..." } lines — works with zero config:
 * const adapter = createFetchStreamAdapter('/api/chat');
 *
 * @example
 * // Plain text streaming (each chunk is raw text, no JSON):
 * const adapter = createFetchStreamAdapter('/api/chat', {
 *   parseChunk: (chunk) => chunk ? [{ type: 'text', text: chunk }] : [],
 * });
 *
 * @example
 * // Custom body + auth:
 * const adapter = createFetchStreamAdapter('/api/chat', {
 *   getHeaders: async () => ({ Authorization: `Bearer ${await getToken()}` }),
 *   getBody: ({ messages, context }) => ({
 *     history: messages,
 *     model: context?.model ?? 'default',
 *   }),
 * });
 */
export function createFetchStreamAdapter(
  url: string,
  options: FetchStreamAdapterOptions = {},
): AiBackendAdapter {
  const {
    method = 'POST',
    headers: staticHeaders = {},
    getHeaders,
    getBody,
    parseChunk = defaultNdjsonParser,
  } = options;

  return {
    async *sendMessage(input: AiAdapterInput): AsyncIterable<AiStreamEvent> {
      const dynamicHeaders = getHeaders ? await getHeaders(input) : {};

      const body = getBody
        ? getBody(input)
        : { messages: input.messages, context: input.context };

      const response = await fetch(url, {
        method,
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

      yield* readChunkedStream(response.body, parseChunk);
    },
  };
}

// ─── Chunked stream reader ────────────────────────────────────────────────────

async function* readChunkedStream(
  body: ReadableStream<Uint8Array>,
  parseChunk: FetchChunkParser,
): AsyncIterable<AiStreamEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Split on newlines — each complete line is one NDJSON record
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? ''; // keep the incomplete trailing line

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const events = parseChunk(trimmed);
        for (const event of events) {
          yield event;
          if (event.type === 'done' || event.type === 'error') return;
        }
      }
    }

    // Flush any remaining buffered content
    if (buffer.trim()) {
      const events = parseChunk(buffer.trim());
      for (const event of events) {
        yield event;
        if (event.type === 'done' || event.type === 'error') return;
      }
    }
  } finally {
    reader.releaseLock();
  }

  yield { type: 'done' };
}

// ─── Default parser: newline-delimited JSON (NDJSON) ─────────────────────────
// Expects lines of the form:
//   { "text": "hello" }   → text chunk
//   { "done": true }      → stream finished
//   { "error": "msg" }    → stream error

const defaultNdjsonParser: FetchChunkParser = (chunk) => {
  try {
    const json = JSON.parse(chunk) as {
      text?: string;
      done?: boolean;
      error?: string;
    };

    if (json.error) return [{ type: 'error', message: json.error }];
    if (json.done)  return [{ type: 'done' }];
    if (json.text)  return [{ type: 'text', text: json.text }];

    return [];
  } catch {
    // Not JSON — treat the raw chunk as plain text
    return [{ type: 'text', text: chunk }];
  }
};
