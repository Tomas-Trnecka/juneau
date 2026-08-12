import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAiChat } from './useAiChat';
import type { AiBackendAdapter, AiStreamEvent } from '../core/types';

function makeAdapter(events: AiStreamEvent[]): AiBackendAdapter {
  return {
    async *sendMessage() {
      for (const event of events) {
        yield event;
      }
    },
  };
}

describe('useAiChat', () => {
  it('appends a user message and an assistant message on send', async () => {
    const adapter = makeAdapter([{ type: 'done' }]);
    const { result } = renderHook(() => useAiChat({ adapter }));

    act(() => result.current.setInput('Hello'));
    await act(() => result.current.sendMessage());

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[1].role).toBe('assistant');
  });

  it('accumulates text chunks into a single text part', async () => {
    const adapter = makeAdapter([
      { type: 'text', text: 'Hel' },
      { type: 'text', text: 'lo' },
      { type: 'text', text: '!' },
      { type: 'done' },
    ]);
    const { result } = renderHook(() => useAiChat({ adapter }));

    act(() => result.current.setInput('hi'));
    await act(() => result.current.sendMessage());

    const assistantMsg = result.current.messages[1];
    expect(assistantMsg.parts).toHaveLength(1);
    expect(assistantMsg.parts[0]).toEqual({ type: 'text', text: 'Hello!' });
  });

  it('sendGreeting produces no user bubble', async () => {
    const adapter = makeAdapter([
      { type: 'text', text: 'Hey there!' },
      { type: 'done' },
    ]);
    const { result } = renderHook(() => useAiChat({ adapter }));

    await act(() => result.current.sendGreeting('greet the user'));

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe('assistant');
  });

  it('sets error state on error event', async () => {
    const adapter = makeAdapter([
      { type: 'error', message: 'Something went wrong' },
    ]);
    const { result } = renderHook(() => useAiChat({ adapter }));

    act(() => result.current.setInput('hi'));
    await act(() => result.current.sendMessage());

    expect(result.current.error).toBe('Something went wrong');
  });

  it('reset clears messages, input, and error', async () => {
    const adapter = makeAdapter([
      { type: 'error', message: 'oops' },
    ]);
    const { result } = renderHook(() => useAiChat({ adapter }));

    act(() => result.current.setInput('hi'));
    await act(() => result.current.sendMessage());
    expect(result.current.messages.length).toBeGreaterThan(0);

    act(() => result.current.reset());

    expect(result.current.messages).toHaveLength(0);
    expect(result.current.input).toBe('');
    expect(result.current.error).toBeNull();
  });

  it('stop aborts the stream but keeps existing messages', async () => {
    let resolveYield!: () => void;
    const adapter: AiBackendAdapter = {
      async *sendMessage() {
        yield { type: 'text', text: 'partial' };
        // hang here until the test unblocks
        await new Promise<void>(r => { resolveYield = r; });
        yield { type: 'text', text: ' more' };
        yield { type: 'done' };
      },
    };

    const { result } = renderHook(() => useAiChat({ adapter }));
    act(() => result.current.setInput('go'));

    const sendPromise = act(() => result.current.sendMessage());
    // let the first chunk land
    await act(async () => { await new Promise(r => setTimeout(r, 10)); });

    act(() => result.current.stop());
    resolveYield();
    await sendPromise;

    // messages still present, stream was cut
    expect(result.current.messages.length).toBeGreaterThan(0);
    expect(result.current.isLoading).toBe(false);
  });

  it('calls onProposalConfirm exactly once when confirmProposal is called', async () => {
    const adapter = makeAdapter([{ type: 'done' }]);
    const onProposalConfirm = vi.fn();
    const { result } = renderHook(() => useAiChat({ adapter, onProposalConfirm }));

    act(() => result.current.confirmProposal('p1', { foo: 'bar' }));

    expect(onProposalConfirm).toHaveBeenCalledTimes(1);
    expect(onProposalConfirm).toHaveBeenCalledWith('p1', { foo: 'bar' });
  });
});
