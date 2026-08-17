import { useState, useCallback, type ReactNode } from 'react';
import { useAiChat } from '../hooks/useAiChat';
import type { AiBackendAdapter } from '../core/types';
import type { AiInputAction } from '../components/AiInput/AiInput';
import { AiChatContext } from './AiChatContext';

type Props = {
  adapter: AiBackendAdapter;
  /** Initial context passed to the adapter. Update it per-page via setContext(). */
  context?: Record<string, unknown>;
  onProposalConfirm?: (proposalId: string, payload: unknown) => void;
  onProposalCancel?: (proposalId: string) => void;
  children: ReactNode;
};

export function AiChatProvider({
  adapter,
  context: initialContext,
  onProposalConfirm,
  onProposalCancel,
  children,
}: Props) {
  const [context, setContextState] = useState<Record<string, unknown> | undefined>(initialContext);

  const setContext = useCallback((ctx: Record<string, unknown>) => {
    setContextState(ctx);
  }, []);

  const chat = useAiChat({
    adapter,
    context,
    onProposalConfirm,
    onProposalCancel,
  });

  return (
    <AiChatContext.Provider value={{ ...chat, setContext }}>
      {children}
    </AiChatContext.Provider>
  );
}
