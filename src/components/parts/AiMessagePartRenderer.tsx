import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { AiMessagePart } from '../../core/types';
import { IconWarning } from '../icons';
import { AiTablePart } from './AiTablePart';
import { AiProposalCard } from './AiProposalCard';
import { AiActivityPart } from './AiActivityPart';
import styles from './AiMessagePartRenderer.module.css';

type Props = {
  part: AiMessagePart;
  onProposalConfirm: (proposalId: string, payload: unknown) => void;
  onProposalCancel: (proposalId: string) => void;
};

export function AiMessagePartRenderer({ part, onProposalConfirm, onProposalCancel }: Props) {
  switch (part.type) {
    case 'text':
      return (
        <div className={styles.markdown}>
          {/* react-markdown never uses dangerouslySetInnerHTML — safe against XSS by default */}
          <Markdown remarkPlugins={[remarkGfm]}>{part.text}</Markdown>
        </div>
      );
    case 'table':
      return <AiTablePart part={part} />;
    case 'activity':
      return <AiActivityPart part={part} />;
    case 'proposal':
      return (
        <AiProposalCard
          part={part}
          onConfirm={onProposalConfirm}
          onCancel={onProposalCancel}
        />
      );
    case 'error':
      return (
        <span className={styles.errorText}>
          <IconWarning className={styles.errorIcon} />
          {part.message}
        </span>
      );
  }
}
