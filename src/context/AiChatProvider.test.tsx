import { describe, it, expect, vi } from 'vitest';
import { useContext, type ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react';
import { AiChatProvider } from './AiChatProvider';
import { AiChatContext, useAiChatContext } from './AiChatContext';
import type { AiBackendAdapter, AiAdapterInput, AiMessage, AiStreamEvent } from '../core/types';

function makeAdapter(events: AiStreamEvent[], seen?: AiAdapterInput[]): AiBackendAdapter {
  return {
    async *sendMessage(input) {
      seen?.push(input);
      for (const event of events) {
        yield event;
      }
    },
  };
}

const wrapperWith = (props: Omit<Parameters<typeof AiChatProvider>[0], 'children'>) =>
  ({ children }: { children: ReactNode }) => (
    <AiChatProvider {...props}>{children}</AiChatProvider>
  );

describe('AiChatProvider', () => {
  it('forwards initialMessages to useAiChat', () => {
    const initialMessages: AiMessage[] = [
      { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'hi' }], createdAt: new Date() },
    ];
    const { result } = renderHook(() => useAiChatContext(), {
      wrapper: wrapperWith({ adapter: makeAdapter([{ type: 'done' }]), initialMessages }),
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].id).toBe('u1');
  });

  it('forwards historyLimit so the adapter receives a trimmed history', async () => {
    const seen: AiAdapterInput[] = [];
    const initialMessages: AiMessage[] = [
      { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'q1' }], createdAt: new Date() },
      { id: 'a1', role: 'assistant', parts: [{ type: 'text', text: 'a1' }], createdAt: new Date() },
      { id: 'u2', role: 'user', parts: [{ type: 'text', text: 'q2' }], createdAt: new Date() },
      { id: 'a2', role: 'assistant', parts: [{ type: 'text', text: 'a2' }], createdAt: new Date() },
    ];
    const { result } = renderHook(() => useAiChatContext(), {
      wrapper: wrapperWith({
        adapter: makeAdapter([{ type: 'done' }], seen),
        initialMessages,
        historyLimit: 3,
      }),
    });

    act(() => result.current.setInput('q3'));
    await act(() => result.current.sendMessage());

    expect(seen[0].messages.map(m => m.id)).toEqual(['u2', 'a2', expect.any(String)]);
  });

  it('forwards onMessagesChange and fires it when the exchange settles', async () => {
    const onMessagesChange = vi.fn();
    const { result } = renderHook(() => useAiChatContext(), {
      wrapper: wrapperWith({
        adapter: makeAdapter([{ type: 'text', text: 'reply' }, { type: 'done' }]),
        onMessagesChange,
      }),
    });

    act(() => result.current.setInput('hi'));
    await act(() => result.current.sendMessage());

    expect(onMessagesChange).toHaveBeenCalledTimes(1);
  });

  it('setContext with an object replaces the whole context', async () => {
    const seen: AiAdapterInput[] = [];
    const { result } = renderHook(() => useAiChatContext(), {
      wrapper: wrapperWith({
        adapter: makeAdapter([{ type: 'done' }], seen),
        context: { sessionId: 's1', pageId: 'home' },
      }),
    });

    act(() => result.current.setContext({ pageId: 'invoices' }));
    act(() => result.current.setInput('hi'));
    await act(() => result.current.sendMessage());

    expect(seen[0].context).toEqual({ pageId: 'invoices' });
  });

  it('setContext with an updater merges with the previous context', async () => {
    const seen: AiAdapterInput[] = [];
    const { result } = renderHook(() => useAiChatContext(), {
      wrapper: wrapperWith({
        adapter: makeAdapter([{ type: 'done' }], seen),
        context: { sessionId: 's1', pageId: 'home' },
      }),
    });

    act(() => result.current.setContext(prev => ({ ...prev, pageId: 'invoices' })));
    act(() => result.current.setInput('hi'));
    await act(() => result.current.sendMessage());

    expect(seen[0].context).toEqual({ sessionId: 's1', pageId: 'invoices' });
  });
});

describe('AiChatContext', () => {
  it('useAiChatContext throws outside a provider', () => {
    expect(() => renderHook(() => useAiChatContext())).toThrow(/AiChatProvider/);
  });

  it('useContext(AiChatContext) returns null outside a provider as a safe escape hatch', () => {
    const { result } = renderHook(() => useContext(AiChatContext));
    expect(result.current).toBeNull();
  });
});
