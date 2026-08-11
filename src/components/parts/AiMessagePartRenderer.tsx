import type { AiMessagePart } from '../../core/types';
import { AiTablePart } from './AiTablePart';
import { AiProposalCard } from './AiProposalCard';
import styles from './AiMessagePartRenderer.module.css';

type Props = {
  part: AiMessagePart;
  onProposalConfirm: (proposalId: string, payload: unknown) => void;
  onProposalCancel: (proposalId: string) => void;
};

export function AiMessagePartRenderer({ part, onProposalConfirm, onProposalCancel }: Props) {
  switch (part.type) {
    case 'text':
      return <span className={styles.text}>{part.text}</span>;
    case 'table':
      return <AiTablePart part={part} />;
    case 'proposal':
      return (
        <AiProposalCard
          part={part}
          onConfirm={onProposalConfirm}
          onCancel={onProposalCancel}
        />
      );
    case 'error':
      return <span className={styles.errorText}>⚠️ {part.message}</span>;
  }
}
