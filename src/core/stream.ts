import type { AiStreamEvent } from './types';

export const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

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
