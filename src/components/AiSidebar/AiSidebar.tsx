import type { CSSProperties, ReactNode } from 'react';
import { useState } from 'react';
import type { AiEntity } from '../../core/types';
import { useAiChatContext } from '../../context/AiChatContext';
import type { AiInputAction } from '../AiInput/AiInput';
import { AiChat } from '../AiChat/AiChat';
import { AiChatHeader } from '../AiChatHeader/AiChatHeader';
import type { RenderPartFn } from '../parts/AiMessagePartRenderer';
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
  /**
   * Called when the user resets the conversation. When provided, a reset
   * button is shown in the header. Internally calls `useAiChatContext().reset()`
   * and then invokes this callback — no wrapper component needed.
   */
  onReset?: () => void;
  /**
   * Custom part renderer — called before the built-in renderers for every
   * message part. Return a ReactNode to render it, or null/undefined to fall
   * through to the built-ins. Enables custom part types like invoice cards.
   */
  renderPart?: RenderPartFn;
  /** Makes entity cards clickable — receives the entity and its optional entityType. */
  onEntityClick?: (entity: AiEntity, entityType?: string) => void;
  /**
   * Extra controls rendered in the header, left of the reset/minimize buttons.
   * Use it for consumer-owned chrome such as a settings button.
   */
  headerActions?: ReactNode;
};

export function AiSidebar({
  title,
  icon,
  actions,
  sendIcon,
  height = '60vh',
  className,
  style,
  onReset,
  renderPart,
  onEntityClick,
  headerActions,
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
    reset,
    confirmProposal,
    cancelProposal,
  } = useAiChatContext();

  const handleReset = onReset
    ? () => { reset(); onReset(); }
    : undefined;

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
        onReset={handleReset}
        headerActions={headerActions}
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
          renderPart={renderPart}
          onEntityClick={onEntityClick}
        />
      )}
    </aside>
  );
}
