import type { ReactNode } from 'react';
import { IconWandMagicSparkles } from '../icons';
import type { AiMessage } from '../../core/types';
import { useLabels } from '../../i18n/context';
import { AiMessagePartRenderer } from '../parts/AiMessagePartRenderer';
import styles from './AiMessageBubble.module.css';

type Props = {
  message: AiMessage;
  onProposalConfirm: (proposalId: string, payload: unknown) => void;
  onProposalCancel: (proposalId: string) => void;
  /** Override the assistant avatar icon. Pass any ReactNode — an SVG, img, or component. Defaults to a brain icon. */
  assistantIcon?: ReactNode;
};

export function AiMessageBubble({ message, onProposalConfirm, onProposalCancel, assistantIcon }: Props) {
  const labels = useLabels();
  const isUser = message.role === 'user';

  return (
    <div className={`${styles.wrapper} ${isUser ? styles.user : styles.assistant}`}>
      {!isUser && (
        <div className={styles.avatar} aria-hidden="true">
          {assistantIcon ?? <IconWandMagicSparkles />}
        </div>
      )}
      <div className={styles.bubble}>
        {message.parts.map((part, i) => (
          <AiMessagePartRenderer
            key={i}
            part={part}
            onProposalConfirm={onProposalConfirm}
            onProposalCancel={onProposalCancel}
          />
        ))}
        {message.parts.length === 0 && (
          <span className={styles.empty} />
        )}
      </div>
      {isUser && <div className={styles.avatar}>{labels.userLabel}</div>}
    </div>
  );
}
