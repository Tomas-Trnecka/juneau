import type { AiMessage, AiStreamEvent } from './types';

/**
 * Prepares a message history array for sending to the backend adapter —
 * the exact same transformation Juneau applies internally before every request.
 *
 * Assistant messages that contain only activity or error parts (no text) are
 * replaced with an empty-text assistant turn so conversation alternation stays
 * valid. Models reject histories where two user messages appear consecutively
 * with no assistant turn in between.
 *
 * Use this to inspect or replicate what Juneau actually sends, e.g. when
 * building a custom adapter or debugging history shape:
 *
 * @example
 * const wire = serializeMessages(messages);
 * console.log(JSON.stringify(wire, null, 2));
 */
export function serializeMessages(messages: AiMessage[]): AiMessage[] {
  return messages.map(msg => {
    if (msg.role !== 'assistant') return msg;
    if (msg.parts.some(p => p.type === 'text')) return msg;
    return { ...msg, parts: [{ type: 'text' as const, text: '' }] };
  });
}

export const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Extracts the plain text content from a message.
 *
 * Concatenates all `text` parts in order. Non-text parts (tables, proposals,
 * errors) are skipped. Returns an empty string if the message has no text parts.
 *
 * Use this in your adapter when you need to read a message's text without
 * digging into the parts array yourself:
 *
 * @example
 * const { messages } = input;
 * const lastUser = [...messages].reverse().find(m => m.role === 'user');
 * const text = lastUser ? getMessageText(lastUser) : '';
 */
export function getMessageText(message: AiMessage): string {
  return message.parts
    .filter((p): p is import('./types').AiTextPart => p.type === 'text')
    .map(p => p.text)
    .join('');
}

/**
 * Iterates over an AsyncIterable of stream events and calls the handler for each.
 * Automatically handles cancellation via AbortSignal.
 */
export async function consumeStream(
  iterable: AsyncIterable<AiStreamEvent>,
  onEvent: (event: AiStreamEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  for await (const event of iterable) {
    if (signal?.aborted) break;
    onEvent(event);
    if (event.type === 'done' || event.type === 'error') break;
  }
}
