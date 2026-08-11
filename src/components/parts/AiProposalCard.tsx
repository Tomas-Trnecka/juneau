import type { AiProposalPart } from '../../core/types';
import { useLabels } from '../../i18n/context';
import styles from './AiProposalCard.module.css';

type Props = {
  part: AiProposalPart;
  onConfirm: (proposalId: string, payload: unknown) => void;
  onCancel: (proposalId: string) => void;
};

export function AiProposalCard({ part, onConfirm, onCancel }: Props) {
  const labels = useLabels();
  const { proposal } = part;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <svg className={styles.icon} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1zM5.05 3.05a.75.75 0 011.06 1.06l-1.06 1.06a.75.75 0 11-1.06-1.06l1.06-1.06zm9.9 0a.75.75 0 010 1.06l-1.06 1.06a.75.75 0 11-1.06-1.06l1.06-1.06a.75.75 0 011.06 0zM10 6a4 4 0 100 8 4 4 0 000-8zm-9 4a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 011 10zm15.75-.75a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5h-1.5zM4.11 14.89a.75.75 0 010 1.06l-1.06 1.06a.75.75 0 11-1.06-1.06l1.06-1.06a.75.75 0 011.06 0zm11.84 1.06a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 101.06 1.06l1.06-1.06zM10 17.25a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75z" />
        </svg>
        <span className={styles.title}>{proposal.title}</span>
      </div>
      {proposal.description && (
        <p className={styles.description}>{proposal.description}</p>
      )}
      <div className={styles.actions}>
        <button
          className={styles.confirm}
          onClick={() => onConfirm(proposal.id, proposal.payload)}
        >
          {proposal.confirmLabel ?? labels.proposalConfirm}
        </button>
        <button
          className={styles.cancel}
          onClick={() => onCancel(proposal.id)}
        >
          {proposal.cancelLabel ?? labels.proposalCancel}
        </button>
      </div>
    </div>
  );
}
