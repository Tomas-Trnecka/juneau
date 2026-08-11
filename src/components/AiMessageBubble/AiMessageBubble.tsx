import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBrain } from '@fortawesome/free-solid-svg-icons';
import type { AiMessage } from '../../core/types';
import { AiMessagePartRenderer } from '../parts/AiMessagePartRenderer';
import styles from './AiMessageBubble.module.css';

type Props = {
  message: AiMessage;
  onProposalConfirm: (proposalId: string, payload: unknown) => void;
  onProposalCancel: (proposalId: string) => void;
};

export function AiMessageBubble({ message, onProposalConfirm, onProposalCancel }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`${styles.wrapper} ${isUser ? styles.user : styles.assistant}`}>
      {!isUser && (
        <div className={styles.avatar}>
          <FontAwesomeIcon icon={faBrain} />
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
      {isUser && <div className={styles.avatar}>You</div>}
    </div>
  );
}
