import type { ToolRecoveryOptions } from './types';
import { streamToWire } from './streamToWire';

function wireError(message: string): string {
  return `data: ${JSON.stringify({ type: 'error', message })}\n\n`;
}

function wireDone(): string {
  return `data: ${JSON.stringify({ type: 'done' })}\n\n`;
}

/**
 * Encapsulates the multi-phase streaming pattern needed for Gemini 2.5 Flash
 * tool call scenarios where the model either fails or silently succeeds without
 * emitting any text in the same stream pass.
 *
 * Phase 1: Stream with tools. Collect whether any text was produced and whether
 *          a tool failure occurred.
 *
 * Phase 2 (failure recovery) — triggers when a tool failed AND no text was produced:
 *   - Injects failureContext as an assistant message so the model is forced to
 *     write a recovery text response (no tools available in phase 2).
 *
 * Phase 3 (silent-success recovery) — triggers when the tool succeeded but the
 * model wrote no text. Confirmed Gemini 2.5 Flash behaviour: the fullStream ends
 * with tool-call → tool-result → finish-step → finish and no text-delta ever
 * arrives — Gemini treats the tool call as its complete response. Phase 3 receives
 * the full phase 1 message history including tool-call AND tool-result turns —
 * Gemini rejects histories where a tool-call turn is not immediately followed by
 * a tool-result turn ("function call turn must come immediately after a user turn
 * or after a function response turn"). The history is resolved from the consumed
 * phase 1 result's `messages` promise (ai-sdk v7 — resolves to all turns after
 * the stream is consumed), with `response.messages` as fallback.
 * If phase3 is not provided, falls back to emitting done (previous behaviour).
 *
 * Errors thrown by phase 2 / phase 3 model calls are surfaced as wire error
 * events — never swallowed into a silent done.
 *
 * @returns AsyncIterable<string> of Juneau wire SSE strings (activities + text + done)
 */
export async function* withToolRecovery(options: ToolRecoveryOptions): AsyncIterable<string> {
  const { phase1, phase2, phase3, skillSet, debug = false } = options;

  if (debug) {
    console.debug('[juneau] withToolRecovery → phase 1 start');
  }

  let producedText = false;

  const result1 = phase1();

  for await (const chunk of streamToWire(result1.fullStream, skillSet, { debug })) {
    // Track whether any text reached the wire (done event doesn't count)
    if (chunk.includes('"type":"text"')) {
      producedText = true;
    }

    // Hold back the done event — we may need to continue with phase 2 or 3
    if (chunk.includes('"type":"done"')) {
      continue;
    }

    yield chunk;
  }

  if (debug) {
    console.debug(
      `[juneau] withToolRecovery → phase 1 complete, textProduced=${producedText}, hadFailure=${skillSet.hadFailure}`
    );
  }

  if (skillSet.hadFailure && !producedText && skillSet.failureContext) {
    // Tool failed and model wrote nothing — run phase 2 to force a text response
    if (debug) {
      console.debug('[juneau] withToolRecovery → hadFailure=true, textProduced=false → triggering phase 2');
    }

    try {
      const result2 = phase2(skillSet.failureContext);

      // Phase 2 has no skillSet — plain text response, no tool calls expected
      yield* streamToWire(result2.fullStream, undefined, { debug });

      if (debug) {
        console.debug('[juneau] withToolRecovery → phase 2 complete');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (debug) {
        console.debug(`[juneau] withToolRecovery → phase 2 FAILED: "${message}"`);
      }
      yield wireError(message);
    }
    return;
  }

  if (!producedText && !skillSet.hadFailure && phase3) {
    // Tool succeeded but model emitted no text — Gemini silent-response scenario.
    // Resolve the full message history from the consumed phase 1 result and let
    // phase 3 call the model again (no tools) to summarise the tool result.
    const fullMessages = await resolvePhase1Messages(result1);

    if (fullMessages) {
      if (debug) {
        console.debug(
          `[juneau] withToolRecovery → phase 3 messages resolved (${fullMessages.length}):`,
          JSON.stringify(fullMessages, null, 2)
        );
        if (!containsToolResult(fullMessages)) {
          console.debug(
            '[juneau] withToolRecovery → WARNING: resolved history contains no tool-result turn — Gemini will likely reject it as an invalid conversation structure'
          );
        }
        console.debug('[juneau] withToolRecovery → no failure, no text → triggering phase 3');
      }

      try {
        yield* streamToWire(phase3(fullMessages).fullStream, undefined, { debug });

        if (debug) {
          console.debug('[juneau] withToolRecovery → phase 3 complete');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (debug) {
          console.debug(`[juneau] withToolRecovery → phase 3 FAILED: "${message}"`);
        }
        yield wireError(message);
      }
      return;
    }

    if (debug) {
      console.debug(
        '[juneau] withToolRecovery → phase 3 configured but phase 1 result exposes no message history — emitting done'
      );
    }
  } else if (!producedText && !skillSet.hadFailure && debug) {
    console.debug(
      '[juneau] withToolRecovery → no failure, no text, no phase3 — emitting done (Gemini silent response)'
    );
  }

  yield wireDone();
}

/**
 * Resolves the full message history (incl. tool-call/tool-result turns) from a
 * consumed ai-sdk StreamTextResult.
 *
 * ai-sdk v7: `result.messages` is the promise that resolves to ALL turns —
 * user, assistant(tool-call), tool(tool-result) — after the stream is consumed.
 * `result.response.messages` may resolve to an incomplete subset (observed:
 * tool-call turn without the following tool-result turn, which Gemini rejects),
 * so it is only used as a fallback when `messages` is unavailable.
 *
 * Both promises resolve only after the fullStream has been fully consumed,
 * which is guaranteed at the call site.
 */
async function resolvePhase1Messages(result: {
  messages?: Promise<unknown[]>;
  response?: Promise<{ messages?: unknown[] }>;
}): Promise<unknown[] | null> {
  if (result.messages) {
    const messages = await result.messages;
    if (Array.isArray(messages) && messages.length > 0) {
      return messages;
    }
  }

  if (result.response) {
    const response = await result.response;
    if (Array.isArray(response?.messages) && response.messages.length > 0) {
      return response.messages;
    }
  }

  return null;
}

/**
 * Checks whether the resolved history contains a tool-result turn — either as
 * a `role: 'tool'` message or a content part with `type: 'tool-result'`.
 * Used only for the debug warning; the messages themselves are passed through opaquely.
 */
function containsToolResult(messages: unknown[]): boolean {
  return messages.some((m) => {
    const msg = m as { role?: string; content?: unknown };
    if (msg.role === 'tool') return true;
    if (Array.isArray(msg.content)) {
      return msg.content.some(
        (part) => (part as { type?: string }).type === 'tool-result'
      );
    }
    return false;
  });
}
