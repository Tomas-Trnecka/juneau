import { useState, useCallback, useRef } from 'react';
import { consumeStream, serializeMessages } from '../core/stream';
import type {
  AiMessage,
  AiMessagePart,
  AiBackendAdapter,
  AiStreamEvent
} from '../core/types';

let messageIdCounter = 0;
const nextId = (): string => `msg-${++messageIdCounter}-${Date.now()}`;

/** Internal alias used throughout this hook. */
const serializeHistory = serializeMessages;

export type UseAiChatOptions = {
  adapter: AiBackendAdapter;
  /** Optional context passed through to every adapter call */
  context?: Record<string, unknown>;
  /** Called when a proposal is confirmed */
  onProposalConfirm?: (proposalId: string, payload: unknown) => void;
  /** Called when a proposal is cancelled */
  onProposalCancel?: (proposalId: string) => void;
};

export type UseAiChatReturn = {
  messages: AiMessage[];
  input: string;
  setInput: (value: string) => void;
  sendMessage: () => Promise<void>;
  /** Sends a message with the given text without touching the input field. Useful for programmatic/init triggers. */
  sendMessageWithText: (text: string) => Promise<void>;
  /**
   * Triggers the adapter with a synthetic context message and streams the response
   * as an assistant message — no user bubble is shown. Use this for proactive
   * greetings or page-load summaries where the AI speaks first.
   */
  sendGreeting: (contextHint: string) => Promise<void>;
  /** Aborts the in-flight stream. No-op if nothing is streaming. */
  stop: () => void;
  isLoading: boolean;
  /**
   * True from the moment a message is sent until the first token arrives from the stream.
   * Use this to show a "connecting…" state distinct from the typing indicator shown
   * while tokens are actively streaming in.
   */
  isConnecting: boolean;
  error: string | null;
  reset: () => void;
  confirmProposal: (proposalId: string, payload: unknown) => void;
  cancelProposal: (proposalId: string) => void;
};

export function useAiChat({
  adapter,
  context,
  onProposalConfirm,
  onProposalCancel
}: UseAiChatOptions): UseAiChatReturn {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref so consumeStream callback always sees latest messages without stale closure
  const abortRef = useRef<AbortController | null>(null);

  const appendPartToLast = useCallback((part: AiMessagePart) => {
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (!last || last.role !== 'assistant') return prev;

      // Activity parts with a stable id upsert in-place instead of appending
      if (part.type === 'activity' && part.id) {
        const parts = [...last.parts];
        const existingIndex = parts.findIndex(
          p => p.type === 'activity' && p.id === part.id
        );
        if (existingIndex !== -1) {
          parts[existingIndex] = part;
          return [...prev.slice(0, -1), { ...last, parts }];
        }
      }

      return [
        ...prev.slice(0, -1),
        { ...last, parts: [...last.parts, part] }
      ];
    });
  }, []);

  const appendTextToLast = useCallback((chunk: string) => {
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (!last || last.role !== 'assistant') return prev;

      const parts = [...last.parts];
      const lastPart = parts[parts.length - 1];

      if (lastPart?.type === 'text') {
        parts[parts.length - 1] = { type: 'text', text: lastPart.text + chunk };
      } else {
        parts.push({ type: 'text', text: chunk });
      }

      return [...prev.slice(0, -1), { ...last, parts }];
    });
  }, []);

  const sendMessageCore = useCallback(async (text: string, currentMessages: AiMessage[]) => {
    setError(null);

    const userMessage: AiMessage = {
      id: nextId(),
      role: 'user',
      parts: [{ type: 'text', text }],
      createdAt: new Date(),
    };

    // Don't add the assistant placeholder upfront — add it lazily on the first
    // event so an immediate error doesn't leave a blank bubble in the UI.
    const assistantId = nextId();
    let assistantAdded = false;

    const ensureAssistantBubble = () => {
      if (assistantAdded) return;
      assistantAdded = true;
      const assistantMessage: AiMessage = {
        id: assistantId,
        role: 'assistant',
        parts: [],
        createdAt: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setIsConnecting(true);

    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const stream = adapter.sendMessage({ messages: serializeHistory([...currentMessages, userMessage]), context });

      await consumeStream(
        stream,
        (event: AiStreamEvent) => {
          // First event of any kind means we're no longer just connecting
          setIsConnecting(false);
          switch (event.type) {
            case 'text':
              ensureAssistantBubble();
              appendTextToLast(event.text);
              break;
            case 'part':
              ensureAssistantBubble();
              appendPartToLast(event.part);
              break;
            case 'error':
              ensureAssistantBubble();
              appendPartToLast({ type: 'error', message: event.message });
              setError(event.message);
              break;
            case 'done': break;
          }
        },
        abort.signal
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      ensureAssistantBubble();
      appendPartToLast({ type: 'error', message });
    } finally {
      setIsLoading(false);
      setIsConnecting(false);
    }
  }, [adapter, context, appendTextToLast, appendPartToLast]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    await sendMessageCore(trimmed, messages);
  }, [input, isLoading, messages, sendMessageCore]);

  const sendMessageWithText = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    await sendMessageCore(text, messages);
  }, [isLoading, messages, sendMessageCore]);

  const sendGreeting = useCallback(async (contextHint: string) => {
    if (isLoading) return;
    setError(null);
    setIsLoading(true);
    setIsConnecting(true);

    // Add only an assistant placeholder — no user bubble
    const assistantMessage: AiMessage = {
      id: nextId(),
      role: 'assistant',
      parts: [],
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, assistantMessage]);

    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    // Pass the hint as a system message so the adapter knows what to generate
    const syntheticContext: AiMessage = {
      id: nextId(),
      role: 'system',
      parts: [{ type: 'text', text: contextHint }],
      createdAt: new Date(),
    };

    try {
      const stream = adapter.sendMessage({ messages: serializeHistory([syntheticContext]), context });
      await consumeStream(
        stream,
        (event: AiStreamEvent) => {
          setIsConnecting(false);
          switch (event.type) {
            case 'text':  appendTextToLast(event.text); break;
            case 'part':  appendPartToLast(event.part); break;
            case 'error':
              appendPartToLast({ type: 'error', message: event.message });
              setError(event.message);
              break;
            case 'done': break;
          }
        },
        abort.signal
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      appendPartToLast({ type: 'error', message });
    } finally {
      setIsLoading(false);
      setIsConnecting(false);
    }
  }, [isLoading, adapter, context, appendTextToLast, appendPartToLast]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
    setIsConnecting(false);
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setInput('');
    setError(null);
    setIsLoading(false);
    setIsConnecting(false);
  }, []);

  const confirmProposal = useCallback((proposalId: string, payload: unknown) => {
    onProposalConfirm?.(proposalId, payload);
  }, [onProposalConfirm]);

  const cancelProposal = useCallback((proposalId: string) => {
    onProposalCancel?.(proposalId);
  }, [onProposalCancel]);

  return {
    messages,
    input,
    setInput,
    sendMessage,
    sendMessageWithText,
    sendGreeting,
    stop,
    isLoading,
    isConnecting,
    error,
    reset,
    confirmProposal,
    cancelProposal
  };
}
