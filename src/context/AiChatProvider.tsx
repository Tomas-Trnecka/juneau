import { useState, useCallback, useMemo, type ReactNode } from 'react';
import { useAiChat } from '../hooks/useAiChat';
import type { AiMessage, AiBackendAdapter } from '../core/types';
import { AiChatContext } from './AiChatContext';

type Props = {
  adapter: AiBackendAdapter;
  /** Initial context passed to the adapter. Update it per-page via setContext(). */
  context?: Record<string, unknown>;
  onProposalConfirm?: (proposalId: string, payload: unknown) => void;
  onProposalCancel?: (proposalId: string) => void;
  /** Restored conversation to start with — typically the output of `deserializeMessages`. */
  initialMessages?: AiMessage[];
  /** Max messages sent to the adapter per request. Rendering is never trimmed. */
  historyLimit?: number;
  /** Called when the conversation settles. Use to persist via `serializeForStorage`. */
  onMessagesChange?: (messages: AiMessage[]) => void;
  children: ReactNode;
};

export function AiChatProvider({
  adapter,
  context: initialContext,
  onProposalConfirm,
  onProposalCancel,
  initialMessages,
  historyLimit,
  onMessagesChange,
  children,
}: Props) {
  const [context, setContextState] = useState<Record<string, unknown> | undefined>(initialContext);

  // Object form replaces the whole context; updater form enables merging
  // without stale closures: setContext(prev => ({ ...prev, pageId: 'x' })).
  const setContext = useCallback((
    ctx:
      | Record<string, unknown>
      | ((prev: Record<string, unknown> | undefined) => Record<string, unknown>)
  ) => {
    if (typeof ctx === 'function') {
      setContextState(prev => ctx(prev));
    } else {
      setContextState(ctx);
    }
  }, []);

  const chat = useAiChat({
    adapter,
    context,
    onProposalConfirm,
    onProposalCancel,
    initialMessages,
    historyLimit,
    onMessagesChange,
  });

  // Memoized so consumers only re-render when chat state actually changes
  const value = useMemo(
    () => ({ ...chat, setContext }),
    [chat, setContext]
  );

  return (
    <AiChatContext.Provider value={value}>
      {children}
    </AiChatContext.Provider>
  );
}
