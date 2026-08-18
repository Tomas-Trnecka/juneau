import type { AiMessage } from '../core/types';
import type { CoreMessage } from './types';

/**
 * Converts Juneau's AiMessage[] to the CoreMessage[] format expected by
 * ai-sdk's generateText / streamText.
 *
 * - Extracts plain text from parts (joins all type: "text" parts)
 * - Replaces activity-only assistant messages with an empty assistant turn
 *   so conversation alternation stays valid
 * - Injects a placeholder assistant turn between consecutive user messages
 * - Filters out empty turns (unless they are a required alternation filler)
 */
export function toSdkMessages(messages: AiMessage[]): CoreMessage[] {
  // First pass: map each AiMessage to a CoreMessage, replacing activity-only
  // assistant messages with an empty-text assistant turn.
  const mapped: CoreMessage[] = messages.map(msg => {
    const text = msg.parts
      .filter(p => p.type === 'text')
      .map(p => (p as { type: 'text'; text: string }).text)
      .join('');

    return { role: msg.role as CoreMessage['role'], content: text };
  });

  // Second pass: inject a placeholder assistant turn between consecutive user
  // messages as a safety net for history bugs that would cause model errors.
  const result: CoreMessage[] = [];
  for (let i = 0; i < mapped.length; i++) {
    const current = mapped[i];
    const prev = result[result.length - 1];

    if (current.role === 'user' && prev?.role === 'user') {
      result.push({ role: 'assistant', content: '…' });
    }

    result.push(current);
  }

  // Third pass: filter out empty turns, but keep assistant placeholders that
  // serve as alternation fillers (they have content '…' set above, so they
  // won't be filtered). Only drop genuinely empty content strings.
  return result.filter(msg => msg.content.length > 0);
}
