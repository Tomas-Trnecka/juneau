import type { CSSProperties, ReactNode } from 'react';
import type { AiBackendAdapter } from '../../core/types';
import type { AiInputAction } from '../AiInput/AiInput';
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
  /** Override the header and assistant avatar icon. Defaults to a brain icon. */
  icon?: ReactNode;
  /**
   * Toolbar action buttons rendered left of the send button.
   * Pass an empty array to hide the toolbar entirely.
   * Defaults to five built-in actions (attach, quick actions, new, history, rules).
   */
  actions?: AiInputAction[];
  /** Override the send button icon. Defaults to a paper-plane icon. */
  sendIcon?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export function AiSidebar({
  adapter,
  title,
  context,
  onProposalConfirm,
  onProposalCancel,
  icon,
  actions,
  sendIcon,
  className,
  style,
}: Props) {
  const {
    messages,
    input,
    setInput,
    sendMessage,
    stop,
    isLoading,
    isConnecting,
    error,
    reset,
    confirmProposal,
    cancelProposal,
  } = useAiChat({ adapter, context, onProposalConfirm, onProposalCancel });

  // confirmProposal / cancelProposal already call the onProposal* callbacks internally —
  // don't call them again here or they fire twice.
  const handleConfirm = (proposalId: string, payload: unknown) => {
    confirmProposal(proposalId, payload);
  };

  const handleCancel = (proposalId: string) => {
    cancelProposal(proposalId);
  };

  return (
    <aside
      className={[styles.sidebar, className].filter(Boolean).join(' ')}
      style={style}
    >
      <AiChatHeader title={title} onReset={reset} icon={icon} />

      <AiChat
        messages={messages}
        input={input}
        isLoading={isLoading}
        isConnecting={isConnecting}
        error={error}
        onInputChange={setInput}
        onSend={sendMessage}
        onStop={stop}
        onProposalConfirm={handleConfirm}
        onProposalCancel={handleCancel}
        assistantIcon={icon}
        actions={actions}
        sendIcon={sendIcon}
      />
    </aside>
  );
}
