import type { ReactNode } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type {
  AiEntity,
  AiMessagePart,
  AiTextPart,
  AiTablePart as AiTablePartType,
  AiProposalPart,
  AiActivityPart as AiActivityPartType,
  AiEntityPart as AiEntityPartType,
  AiEntityListPart as AiEntityListPartType,
  AiErrorPart,
} from '../../core/types';
import { IconWarning } from '../icons';
import { AiTablePart } from './AiTablePart';
import { AiProposalCard } from './AiProposalCard';
import { AiActivityPart } from './AiActivityPart';
import { AiEntityCard } from './AiEntityCard';
import { AiEntityListPart } from './AiEntityListPart';
import styles from './AiMessagePartRenderer.module.css';

/**
 * Consumer escape hatch for rendering custom part types (or overriding
 * built-in ones). Receives the raw part object with no narrowing or
 * validation applied — the consumer owns all type assertions.
 * Return null/undefined to fall through to the built-in renderers.
 */
export type RenderPartFn = (part: AiMessagePart) => ReactNode | null | undefined;

type Props = {
  part: AiMessagePart;
  onProposalConfirm: (proposalId: string, payload: unknown) => void;
  onProposalCancel: (proposalId: string) => void;
  /** Makes entity cards clickable — receives the entity and its optional entityType. */
  onEntityClick?: (entity: AiEntity, entityType?: string) => void;
  /** Called before the built-in switch — a non-nullish return value wins. */
  renderPart?: RenderPartFn;
};

export function AiMessagePartRenderer({ part, onProposalConfirm, onProposalCancel, onEntityClick, renderPart }: Props) {
  // Consumer renderer takes priority — lets it override built-ins too
  if (renderPart) {
    const custom = renderPart(part);
    if (custom !== null && custom !== undefined) {
      return <>{custom}</>;
    }
  }

  // AiCustomPart's `type: string` absorbs literal narrowing, so the built-in
  // cases cast explicitly. The shapes are guaranteed by the wire protocol.
  switch (part.type) {
    case 'text':
      return (
        <div className={styles.markdown}>
          {/* react-markdown never uses dangerouslySetInnerHTML — safe against XSS by default */}
          <Markdown remarkPlugins={[remarkGfm]}>{(part as AiTextPart).text}</Markdown>
        </div>
      );
    case 'table':
      return <AiTablePart part={part as AiTablePartType} />;
    case 'activity':
      return <AiActivityPart part={part as AiActivityPartType} />;
    case 'proposal':
      return (
        <AiProposalCard
          part={part as AiProposalPart}
          onConfirm={onProposalConfirm}
          onCancel={onProposalCancel}
        />
      );
    case 'entity':
      return <AiEntityCard part={part as AiEntityPartType} onEntityClick={onEntityClick} />;
    case 'entity-list':
      return <AiEntityListPart part={part as AiEntityListPartType} onEntityClick={onEntityClick} />;
    case 'error':
      return (
        <span className={styles.errorText}>
          <IconWarning className={styles.errorIcon} />
          {(part as AiErrorPart).message}
        </span>
      );
    default:
      // Unknown custom part with no renderPart handler. Invisible in
      // production; a visible outline in dev so it's never a silent mystery.
      // Structural globalThis access: `process` may not exist in browsers and
      // the lib compiles without @types/node.
      const nodeEnv = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV;
      if (nodeEnv !== 'production') {
        return (
          <div className={styles.unknownPart}>
            Unhandled part type: <code>{part.type}</code> — pass a{' '}
            <code>renderPart</code> prop to render it.
          </div>
        );
      }
      return null;
  }
}
