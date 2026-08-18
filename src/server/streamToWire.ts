import type { SkillSet, StreamToWireOptions } from './types';

// ai-sdk v7 chunk types that carry the model's text output.
// - 'text-delta': standard streaming text (v6 + v7)
// - 'text':       emitted by some v7 model/provider combos as a completed text chunk
// Both may appear in the same stream; we handle either.
const TEXT_CHUNK_TYPES = new Set(['text-delta', 'text']);

// Chunk types we recognise but intentionally ignore — activities are driven by
// the SkillSet execute fn, not by these wire events.
const IGNORED_CHUNK_TYPES = new Set([
  'tool-call',
  'tool-result',
  'tool-input-start',
  'tool-input-delta',
  'tool-input-available',
  'tool-output-available',
  'step-start',
  'finish-step',
  'start',
  'finish',
  'response-metadata',
  'stream-start',
]);

/**
 * Converts ai-sdk's fullStream AsyncIterable into Juneau wire SSE strings.
 *
 * Handles:
 * - All text chunk types used by ai-sdk v7 (text-delta, text) incl. v6 textDelta fallback
 * - Flushing skillSet.drainActivities() before each text chunk so activities
 *   always appear before the text they precede
 * - A final drain after the loop ends (catches last-tool-call activities when
 *   no text follows the tool result — the Gemini silent-response scenario)
 * - Emitting the done event when the stream finishes
 * - Structured debug logging of every chunk when options.debug is true
 */
export async function* streamToWire(
  fullStream: AsyncIterable<unknown>,
  skillSet?: SkillSet,
  options?: StreamToWireOptions
): AsyncIterable<string> {
  const debug = options?.debug ?? false;

  for await (const chunk of fullStream) {
    const c = chunk as Record<string, unknown>;
    const type = c.type as string | undefined;

    if (debug) {
      if (type && TEXT_CHUNK_TYPES.has(type)) {
        const text = (c.text ?? c.textDelta) as string | undefined;
        console.debug(`[juneau] streamToWire chunk: ${type} ${JSON.stringify(text ?? '')}`);
      } else if (type === 'tool-call') {
        console.debug(`[juneau] streamToWire chunk: tool-call "${c.toolName ?? c.name ?? '?'}"`);
      } else if (type === 'tool-result') {
        console.debug(`[juneau] streamToWire chunk: tool-result (ignored)`);
      } else if (type) {
        if (IGNORED_CHUNK_TYPES.has(type)) {
          console.debug(`[juneau] streamToWire chunk: ${type} (ignored)`);
        } else {
          console.debug(`[juneau] streamToWire chunk: ${type} (unknown)`);
        }
      }
    }

    if (type && TEXT_CHUNK_TYPES.has(type)) {
      // Flush any buffered activity events before emitting text so the UI
      // shows running/done indicators before the model's reply appears.
      if (skillSet) {
        const activities = skillSet.drainActivities();
        if (debug && activities.length > 0) {
          console.debug(`[juneau] streamToWire → draining ${activities.length} activities`);
        }
        for (const event of activities) {
          yield event;
        }
      }

      // ai-sdk v7 uses `text`, v6 used `textDelta` — support both
      const text = (c.text ?? c.textDelta) as string | undefined;
      if (text) {
        if (debug) {
          console.debug(`[juneau] streamToWire → yielding text ${JSON.stringify(text)}`);
        }
        yield `data: ${JSON.stringify({ type: 'text', text })}\n\n`;
      }
    }

    // All other chunk types are intentionally silent — the SkillSet execute fn
    // emits activity events into its buffer which we drain above.
  }

  // Final drain — catches activity events from the last tool call when no
  // text-delta followed (Gemini sometimes calls a tool successfully but emits
  // the reply text in a subsequent step that never arrives as text-delta here).
  if (skillSet) {
    const remaining = skillSet.drainActivities();
    if (debug && remaining.length > 0) {
      console.debug(`[juneau] streamToWire → draining ${remaining.length} activities (end of stream)`);
    }
    for (const event of remaining) {
      yield event;
    }
  }

  if (debug) {
    console.debug('[juneau] streamToWire → end of stream, emitting done');
  }

  yield `data: ${JSON.stringify({ type: 'done' })}\n\n`;
}
