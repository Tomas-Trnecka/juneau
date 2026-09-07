import type { CSSProperties, ReactNode } from 'react';
import type { AiEntity, AiMessage } from '../../core/types';
import type { AiInputAction } from '../AiInput/AiInput';
import { AiMessageList } from '../AiMessageList/AiMessageList';
import { AiInput } from '../AiInput/AiInput';
import { AiError } from '../AiError/AiError';
import type { RenderPartFn } from '../parts/AiMessagePartRenderer';
import styles from './AiChat.module.css';

type Props = {
  messages: AiMessage[];
  input: string;
  isLoading: boolean;
  isConnecting: boolean;
  error: string | null;
  onInputChange: (value: string) => void;
  onSend: () => void;
  /** Called when the user cancels the in-flight stream. Shown as a stop button while isLoading. */
  onStop?: () => void;
  onProposalConfirm: (proposalId: string, payload: unknown) => void;
  onProposalCancel: (proposalId: string) => void;
  /** Makes entity cards clickable — receives the entity and its optional entityType. */
  onEntityClick?: (entity: AiEntity, entityType?: string) => void;
  placeholder?: string;
  /** Override the assistant avatar icon. Forwarded to every message bubble. */
  assistantIcon?: ReactNode;
  /**
   * Toolbar action buttons rendered left of the send button.
   * Pass an empty array to hide the toolbar entirely.
   * Defaults to five built-in actions (attach, quick actions, new, history, rules).
   */
  actions?: AiInputAction[];
  /** Override the send button icon. Defaults to a paper-plane icon. */
  sendIcon?: ReactNode;
  /**
   * Custom part renderer — called before the built-in renderers for every
   * message part. Return a ReactNode to render it, or null/undefined to fall
   * through to the built-ins. Enables custom part types like invoice cards.
   */
  renderPart?: RenderPartFn;
  /**
   * Rendered instead of the default empty-state text when there are no messages.
   * Use it for a rich "get started" hero — headline, suggestion chips, anything.
   */
  emptyState?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/**
 * Presentational chat body — message list, input bar, and error banner.
 * Contains no state or hooks. The parent is responsible for calling useAiChat
 * and passing the results here.
 *
 * Used by AiSidebar (inside the sidebar chrome) and directly in dashboard
 * or any other layout where you want chat without the sidebar wrapper.
 */
export function AiChat({
  messages,
  input,
  isLoading,
  isConnecting,
  error,
  onInputChange,
  onSend,
  onStop,
  onProposalConfirm,
  onProposalCancel,
  onEntityClick,
  placeholder,
  assistantIcon,
  actions,
  sendIcon,
  renderPart,
  emptyState,
  className,
  style,
}: Props) {
  return (
    <div
      className={[styles.chat, className].filter(Boolean).join(' ')}
      style={style}
    >
      <AiMessageList
        messages={messages}
        isLoading={isLoading}
        isConnecting={isConnecting}
        onProposalConfirm={onProposalConfirm}
        onProposalCancel={onProposalCancel}
        onEntityClick={onEntityClick}
        assistantIcon={assistantIcon}
        renderPart={renderPart}
        emptyState={emptyState}
      />

      {error && <AiError message={error} />}

      <AiInput
        value={input}
        onChange={onInputChange}
        onSend={onSend}
        onStop={onStop}
        isLoading={isLoading}
        placeholder={placeholder}
        actions={actions}
        sendIcon={sendIcon}
      />
    </div>
  );
}
