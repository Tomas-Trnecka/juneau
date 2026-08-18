import type { SkillSet } from './types';

/**
 * Converts ai-sdk's fullStream AsyncIterable into Juneau wire SSE strings.
 *
 * Handles:
 * - ai-sdk v7 chunk property rename (chunk.text) with fallback to v6 (chunk.textDelta)
 * - Flushing skillSet.drainActivities() before each text chunk
 * - A final drain after the loop ends (catches last tool call activities)
 * - Emitting the done event when the stream finishes
 */
export async function* streamToWire(
  fullStream: AsyncIterable<unknown>,
  skillSet?: SkillSet
): AsyncIterable<string> {
  for await (const chunk of fullStream) {
    const c = chunk as Record<string, unknown>;

    if (c.type === 'text-delta') {
      // Flush any buffered activity events before emitting text
      if (skillSet) {
        for (const event of skillSet.drainActivities()) {
          yield event;
        }
      }

      // ai-sdk v7 uses `text`, v6 used `textDelta`
      const text = (c.text ?? c.textDelta) as string | undefined;
      if (text) {
        yield `data: ${JSON.stringify({ type: 'text', text })}\n\n`;
      }
    }

    // tool-call and tool-result chunks are handled silently — the SkillSet
    // execute fn emits activity events into its buffer which we drain above.
  }

  // Final drain — catches activity events from the last tool call that fired
  // after the last text-delta (or when there were no text deltas at all).
  if (skillSet) {
    for (const event of skillSet.drainActivities()) {
      yield event;
    }
  }

  yield `data: ${JSON.stringify({ type: 'done' })}\n\n`;
}
