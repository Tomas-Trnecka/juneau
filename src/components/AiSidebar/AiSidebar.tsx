import type { CSSProperties } from 'react';
import type { AiBackendAdapter } from '../../core/types';
import { useAiChat } from '../../hooks/useAiChat';
import { AiChat } from '../AiChat/AiChat';
import { AiChatHeader } from '../AiChatHeader/AiChatHeader';
import styles from './AiSidebar.module.css';

type Props = {
  adapter: AiBackendAdapter;
  /** Overrides the `sidebarTitle` label for this instance only. */
  title?: string;
  context?: Record<string, unknown>;
  onProposalConfirm?: (proposalId: string, payload: unknown) => void;
  onProposalCancel?: (proposalId: string) => void;
  className?: string;
  style?: CSSProperties;
};

export function AiSidebar({
  adapter,
  title,
  context,
  onProposalConfirm,
  onProposalCancel,
  className,
  style,
}: Props) {
  const {
    messages,
    input,
    setInput,
    sendMessage,
    isLoading,
    error,
    reset,
    confirmProposal,
    cancelProposal,
  } = useAiChat({ adapter, context, onProposalConfirm, onProposalCancel });

  const handleConfirm = (proposalId: string, payload: unknown) => {
    confirmProposal(proposalId, payload);
    onProposalConfirm?.(proposalId, payload);
  };

  const handleCancel = (proposalId: string) => {
    cancelProposal(proposalId);
    onProposalCancel?.(proposalId);
  };

  return (
    <aside
      className={[styles.sidebar, className].filter(Boolean).join(' ')}
      style={style}
    >
      <AiChatHeader title={title} onReset={reset} />

      <AiChat
        messages={messages}
        input={input}
        isLoading={isLoading}
        error={error}
        onInputChange={setInput}
        onSend={sendMessage}
        onProposalConfirm={handleConfirm}
        onProposalCancel={handleCancel}
      />
    </aside>
  );
}
