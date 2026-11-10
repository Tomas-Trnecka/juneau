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
  /** Override only the message avatar. Falls back to `icon` when omitted. */
  assistantIcon?: ReactNode;
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
   * Gate asked before the conversation is cleared. Resolve false to abort —
   * nothing is reset and `onReset` never fires. Use it for a confirm dialog.
   */
  confirmReset?: () => boolean | Promise<boolean>;
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
  /**
   * Rendered right of the header title. Use it for an unread/notification badge.
   * Juneau renders it as given and never interprets it.
   */
  badge?: ReactNode;
  /**
   * Collapsed state. Omit to let the sidebar own it; pass a value to control it
   * (e.g. to persist the choice) and keep it in sync via `onMinimizedChange`.
   */
  minimized?: boolean;
  /** Fires whenever the user toggles the collapsed state, controlled or not. */
  onMinimizedChange?: (minimized: boolean) => void;
  /**
   * Rendered instead of the default empty-state text when there are no messages.
   * Use it for a rich "get started" hero — headline, suggestion chips, anything.
   */
  emptyState?: ReactNode;
  /**
   * Consumer content rendered directly above the input, e.g. a feedback prompt.
   * Forwarded to `AiChat`; hidden together with the chat body while minimized.
   */
  aboveInput?: ReactNode;
};

export function AiSidebar({
  title,
  icon,
  assistantIcon,
  actions,
  sendIcon,
  height = '60vh',
  className,
  style,
  onReset,
  confirmReset,
  renderPart,
  onEntityClick,
  headerActions,
  badge,
  minimized,
  onMinimizedChange,
  emptyState,
  aboveInput,
}: Props) {
  const [uncontrolledMinimized, setUncontrolledMinimized] = useState(false);
  // Controlled when `minimized` is supplied; otherwise the sidebar keeps owning the state.
  const isControlled = minimized !== undefined;
  const isMinimized = isControlled ? minimized : uncontrolledMinimized;

  const toggleMinimized = (): void => {
    const next = !isMinimized;
    if (!isControlled) setUncontrolledMinimized(next);
    onMinimizedChange?.(next);
  };

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

  // The gate runs before the wipe, so a declined confirm leaves the chat untouched.
  const handleReset = onReset
    ? async () => {
        if (confirmReset && !(await confirmReset())) return;
        reset();
        onReset();
      }
    : undefined;

  return (
    <aside
      className={[styles.sidebar, isMinimized ? styles.minimized : '', className].filter(Boolean).join(' ')}
      style={{ height: isMinimized ? undefined : height, ...style }}
      data-juneau="sidebar"
    >
      <AiChatHeader
        title={title}
        icon={icon}
        onMinimize={toggleMinimized}
        isMinimized={isMinimized}
        onReset={handleReset}
        badge={badge}
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
          assistantIcon={assistantIcon ?? icon}
          actions={actions}
          sendIcon={sendIcon}
          renderPart={renderPart}
          onEntityClick={onEntityClick}
          emptyState={emptyState}
          aboveInput={aboveInput}
        />
      )}
    </aside>
  );
}
