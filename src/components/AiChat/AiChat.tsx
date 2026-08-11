import type { CSSProperties } from 'react';
import type { AiMessage } from '../../core/types';
import { AiMessageList } from '../AiMessageList/AiMessageList';
import { AiInput } from '../AiInput/AiInput';
import { AiError } from '../AiError/AiError';
import styles from './AiChat.module.css';

type Props = {
  // State — provided by the parent (useAiChat)
  messages: AiMessage[];
  input: string;
  isLoading: boolean;
  error: string | null;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onProposalConfirm: (proposalId: string, payload: unknown) => void;
  onProposalCancel: (proposalId: string) => void;
  // Presentation
  placeholder?: string;
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
  error,
  onInputChange,
  onSend,
  onProposalConfirm,
  onProposalCancel,
  placeholder,
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
        onProposalConfirm={onProposalConfirm}
        onProposalCancel={onProposalCancel}
      />

      {error && <AiError message={error} />}

      <AiInput
        value={input}
        onChange={onInputChange}
        onSend={onSend}
        isLoading={isLoading}
        placeholder={placeholder}
      />
    </div>
  );
}
