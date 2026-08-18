import type { ToolRecoveryOptions } from './types';
import { streamToWire } from './streamToWire';

/**
 * Encapsulates the two-phase streaming pattern needed when a tool fails and
 * the model retries the tool instead of writing text (observed with Gemini 2.5 Flash).
 *
 * Phase 1: Stream with tools, maxSteps: 1. Collect whether any text was produced.
 * Phase 2: If a tool failed and no text was produced, call the model again without
 *          tools, injecting the failure context as an assistant message so the model
 *          is forced to write a text response.
 *
 * @returns AsyncIterable<string> of Juneau wire SSE strings (activities + text + done)
 */
export async function* withToolRecovery(options: ToolRecoveryOptions): AsyncIterable<string> {
  const { phase1, phase2, skillSet } = options;

  let producedText = false;

  const result1 = phase1();

  for await (const chunk of streamToWire(result1.fullStream, skillSet)) {
    // Track whether any text reached the wire (done event doesn't count)
    if (chunk.includes('"type":"text"')) {
      producedText = true;
    }

    // Don't yield the done event yet — we may need to continue with phase 2
    if (chunk.includes('"type":"done"')) {
      continue;
    }

    yield chunk;
  }

  // If a tool failed and the model produced no text, run phase 2 to force a
  // text response without tools available.
  if (skillSet.hadFailure && !producedText && skillSet.failureContext) {
    const result2 = phase2(skillSet.failureContext);

    // Phase 2 has no skillSet — plain text stream, no tool calls
    yield* streamToWire(result2.fullStream);
  } else {
    // All good — emit done
    yield `data: ${JSON.stringify({ type: 'done' })}\n\n`;
  }
}
