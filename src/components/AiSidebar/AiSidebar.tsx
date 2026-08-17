import type { CSSProperties, ReactNode } from 'react';
import { useState } from 'react';
import { useAiChatContext } from '../../context/AiChatContext';
import type { AiInputAction } from '../AiInput/AiInput';
import { AiChat } from '../AiChat/AiChat';
import { AiChatHeader } from '../AiChatHeader/AiChatHeader';
import styles from './AiSidebar.module.css';

type Props = {
  /** Overrides the `sidebarTitle` label for this instance only. */
  title?: string;
  /** Override the header and assistant avatar icon. Defaults to a wand icon. */
  icon?: ReactNode;
  /**
   * Toolbar action buttons rendered left of the send button.
   * Pass an empty array to hide the toolbar entirely.
   */
  actions?: AiInputAction[];
  /** Override the send button icon. Defaults to a paper-plane icon. */
  sendIcon?: ReactNode;
  /**
   * Height of the sidebar when open. Any valid CSS value.
   * Defaults to '60vh'.
   */
  height?: string;
  className?: string;
  style?: CSSProperties;
};

export function AiSidebar({
  title,
  icon,
  actions,
  sendIcon,
  height = '60vh',
  className,
  style,
}: Props) {
  const [isMinimized, setIsMinimized] = useState(false);

  const {
    messages,
    input,
    setInput,
    sendMessage,
    stop,
    isLoading,
    isConnecting,
    error,
    confirmProposal,
    cancelProposal,
  } = useAiChatContext();

  return (
    <aside
      className={[styles.sidebar, isMinimized ? styles.minimized : '', className].filter(Boolean).join(' ')}
      style={{ height: isMinimized ? undefined : height, ...style }}
    >
      <AiChatHeader
        title={title}
        icon={icon}
        onMinimize={() => setIsMinimized(v => !v)}
        isMinimized={isMinimized}
      />

      {!isMinimized && (
        <AiChat
          messages={messages}
          input={input}
          isLoading={isLoading}
          isConnecting={isConnecting}
          error={error}
          onInputChange={setInput}
          onSend={sendMessage}
          onStop={stop}
          onProposalConfirm={confirmProposal}
          onProposalCancel={cancelProposal}
          assistantIcon={icon}
          actions={actions}
          sendIcon={sendIcon}
        />
      )}
    </aside>
  );
}
