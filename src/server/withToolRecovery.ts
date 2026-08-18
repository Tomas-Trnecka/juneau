import type { ToolRecoveryOptions } from './types';
import { streamToWire } from './streamToWire';

/**
 * Encapsulates the two-phase streaming pattern needed for Gemini 2.5 Flash
 * tool call scenarios where the model either fails or silently succeeds without
 * emitting any text in the same stream pass.
 *
 * Phase 1: Stream with tools, maxSteps: 2 (or higher). Collect whether any
 *          text was produced and whether a tool failure occurred.
 *
 * Phase 2 triggers when a tool failed AND no text was produced:
 *   - Injects failureContext as an assistant message so the model is forced to
 *     write a recovery text response (no tools available in phase 2).
 *
 * Silent-success path (hadFailure=false, textProduced=false):
 *   - Gemini called the tool successfully but wrote nothing. This is a known
 *     Gemini 2.5 Flash behaviour when maxSteps > 1: the tool result and the
 *     model's reply text arrive as separate steps, and text-delta may not be
 *     emitted by the time phase 1's fullStream is exhausted. The debug logs
 *     will reveal the exact chunk sequence. In this state we still emit done
 *     cleanly — the consumer can decide whether to retry.
 *
 * @returns AsyncIterable<string> of Juneau wire SSE strings (activities + text + done)
 */
export async function* withToolRecovery(options: ToolRecoveryOptions): AsyncIterable<string> {
  const { phase1, phase2, skillSet, debug = false } = options;

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

    // Hold back the done event — we may need to continue with phase 2
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

    const result2 = phase2(skillSet.failureContext);

    // Phase 2 has no skillSet — plain text response, no tool calls expected
    yield* streamToWire(result2.fullStream, undefined, { debug });

    if (debug) {
      console.debug('[juneau] withToolRecovery → phase 2 complete');
    }
  } else if (!producedText && !skillSet.hadFailure) {
    // Tool succeeded but model emitted no text — Gemini silent-response scenario.
    // Log clearly so the consumer can see this in debug output and diagnose
    // whether text arrived in a different chunk type or was simply not generated.
    if (debug) {
      console.debug(
        '[juneau] withToolRecovery → no failure, no text — emitting done (possible Gemini silent response)'
      );
    }

    yield `data: ${JSON.stringify({ type: 'done' })}\n\n`;
  } else {
    // Normal success — text was produced, emit done
    yield `data: ${JSON.stringify({ type: 'done' })}\n\n`;
  }
}
