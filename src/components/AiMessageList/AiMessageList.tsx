import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { AiMessage } from '../../core/types';
import { useLabels } from '../../i18n/context';
import { AiMessageBubble } from '../AiMessageBubble/AiMessageBubble';
import { AiTypingIndicator } from '../AiTypingIndicator/AiTypingIndicator';
import styles from './AiMessageList.module.css';

type Props = {
  messages: AiMessage[];
  isLoading: boolean;
  /** True while waiting for the first token — shows a "connecting" label inside the typing indicator. */
  isConnecting: boolean;
  onProposalConfirm: (proposalId: string, payload: unknown) => void;
  onProposalCancel: (proposalId: string) => void;
  /** Override the assistant avatar icon. Forwarded to every AiMessageBubble. */
  assistantIcon?: ReactNode;
};

export function AiMessageList({ messages, isLoading, isConnecting, onProposalConfirm, onProposalCancel, assistantIcon }: Props) {
  const labels = useLabels();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className={styles.list}>
      {messages.length === 0 && (
        <div className={styles.empty}>
          <p>{labels.emptyStateText}</p>
          <p className={styles.hint}>
            <em>{labels.emptyStateHint}</em>
          </p>
        </div>
      )}
      {messages.map(message => (
        <AiMessageBubble
          key={message.id}
          message={message}
          onProposalConfirm={onProposalConfirm}
          onProposalCancel={onProposalCancel}
          assistantIcon={assistantIcon}
        />
      ))}
      {isLoading && (
        <div className={styles.typing}>
          <AiTypingIndicator connecting={isConnecting} />
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
