import { createContext, useContext } from 'react';
import type { UseAiChatReturn } from '../hooks/useAiChat';

export type AiChatContextValue = UseAiChatReturn & {
  /**
   * Update the context forwarded to every adapter.sendMessage call.
   * Call this on each page/view to tell the AI where the user is,
   * what tools are available, etc.
   */
  setContext: (ctx: Record<string, unknown>) => void;
};

export const AiChatContext = createContext<AiChatContextValue | null>(null);

/**
 * Returns the shared chat state from the nearest AiChatProvider.
 * Throws if called outside of one — fail fast is better than silent undefined.
 */
export function useAiChatContext(): AiChatContextValue {
  const ctx = useContext(AiChatContext);
  if (!ctx) {
    throw new Error(
      'useAiChatContext must be used inside <AiChatProvider>. ' +
      'Wrap your app (or layout) with <AiChatProvider adapter={...}>.'
    );
  }
  return ctx;
}
