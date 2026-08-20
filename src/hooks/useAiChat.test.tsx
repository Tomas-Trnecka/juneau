import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAiChat } from './useAiChat';
import type { AiBackendAdapter, AiMessage, AiStreamEvent } from '../core/types';

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
    const adapter = makeAdapter([{ type: 'text', text: 'hi there' }, { type: 'done' }]);
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

  it('marks the proposal resolved in message state on confirm', async () => {
    const adapter = makeAdapter([
      { type: 'part', part: { type: 'proposal', proposal: { id: 'p1', title: 'Do it' } } },
      { type: 'done' },
    ]);
    const { result } = renderHook(() => useAiChat({ adapter }));

    act(() => result.current.setInput('go'));
    await act(() => result.current.sendMessage());
    act(() => result.current.confirmProposal('p1', undefined));

    const part = result.current.messages[1].parts[0];
    expect(part).toMatchObject({ type: 'proposal', proposal: { id: 'p1', resolved: 'confirmed' } });
  });

  it('starts with initialMessages when provided', () => {
    const adapter = makeAdapter([{ type: 'done' }]);
    const initialMessages: AiMessage[] = [
      { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'hi' }], createdAt: new Date() },
      { id: 'a1', role: 'assistant', parts: [{ type: 'text', text: 'hello' }], createdAt: new Date() },
    ];
    const { result } = renderHook(() => useAiChat({ adapter, initialMessages }));

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].id).toBe('u1');
  });

  it('sends at most historyLimit messages to the adapter', async () => {
    const seen: AiMessage[][] = [];
    const adapter: AiBackendAdapter = {
      async *sendMessage(input) {
        seen.push(input.messages);
        yield { type: 'done' } as AiStreamEvent;
      },
    };
    const initialMessages: AiMessage[] = [
      { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'q1' }], createdAt: new Date() },
      { id: 'a1', role: 'assistant', parts: [{ type: 'text', text: 'a1' }], createdAt: new Date() },
      { id: 'u2', role: 'user', parts: [{ type: 'text', text: 'q2' }], createdAt: new Date() },
      { id: 'a2', role: 'assistant', parts: [{ type: 'text', text: 'a2' }], createdAt: new Date() },
    ];
    const { result } = renderHook(() => useAiChat({ adapter, initialMessages, historyLimit: 3 }));

    act(() => result.current.setInput('q3'));
    await act(() => result.current.sendMessage());

    // limit 3 would start at 'a2' — cut moves forward so history starts with a user turn
    expect(seen[0].map(m => m.id)).toEqual(['u2', 'a2', expect.any(String)]);
    // rendering is never trimmed
    expect(result.current.messages.length).toBeGreaterThanOrEqual(5);
  });

  it('calls onMessagesChange once after an exchange settles, not per token', async () => {
    const adapter = makeAdapter([
      { type: 'text', text: 'a' },
      { type: 'text', text: 'b' },
      { type: 'text', text: 'c' },
      { type: 'done' },
    ]);
    const onMessagesChange = vi.fn();
    const { result } = renderHook(() => useAiChat({ adapter, onMessagesChange }));

    act(() => result.current.setInput('hi'));
    await act(() => result.current.sendMessage());

    expect(onMessagesChange).toHaveBeenCalledTimes(1);
    const settled = onMessagesChange.mock.calls[0][0] as AiMessage[];
    expect(settled[1].parts[0]).toEqual({ type: 'text', text: 'abc' });
  });

  it('reset with nextMessages loads a different conversation', async () => {
    const adapter = makeAdapter([{ type: 'done' }]);
    const { result } = renderHook(() => useAiChat({ adapter }));

    const stored: AiMessage[] = [
      { id: 'u9', role: 'user', parts: [{ type: 'text', text: 'old chat' }], createdAt: new Date() },
    ];
    act(() => result.current.reset(stored));

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].id).toBe('u9');
  });
});
