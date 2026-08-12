import { describe, it, expect, vi } from 'vitest';
import { consumeStream } from './stream';
import type { AiStreamEvent } from './types';

async function* makeStream(events: AiStreamEvent[], delayMs = 0): AsyncIterable<AiStreamEvent> {
  for (const event of events) {
    if (delayMs) await new Promise(r => setTimeout(r, delayMs));
    yield event;
  }
}

describe('consumeStream', () => {
  it('calls onEvent for every event in the stream', async () => {
    const events: AiStreamEvent[] = [
      { type: 'text', text: 'hello' },
      { type: 'text', text: ' world' },
      { type: 'done' },
    ];
    const handler = vi.fn();
    await consumeStream(makeStream(events), handler);
    expect(handler).toHaveBeenCalledTimes(3);
    expect(handler).toHaveBeenNthCalledWith(1, events[0]);
    expect(handler).toHaveBeenNthCalledWith(2, events[1]);
    expect(handler).toHaveBeenNthCalledWith(3, events[2]);
  });

  it('stops processing after a done event', async () => {
    const events: AiStreamEvent[] = [
      { type: 'text', text: 'hi' },
      { type: 'done' },
      { type: 'text', text: 'should not arrive' },
    ];
    const handler = vi.fn();
    await consumeStream(makeStream(events), handler);
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('stops processing after an error event', async () => {
    const events: AiStreamEvent[] = [
      { type: 'text', text: 'hi' },
      { type: 'error', message: 'boom' },
      { type: 'text', text: 'should not arrive' },
    ];
    const handler = vi.fn();
    await consumeStream(makeStream(events), handler);
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('stops processing when the AbortSignal is aborted', async () => {
    const controller = new AbortController();
    const handler = vi.fn(() => {
      // abort after the first event
      controller.abort();
    });
    const events: AiStreamEvent[] = [
      { type: 'text', text: 'first' },
      { type: 'text', text: 'second' },
      { type: 'done' },
    ];
    await consumeStream(makeStream(events), handler, controller.signal);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
