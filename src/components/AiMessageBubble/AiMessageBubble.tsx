import type { ReactNode } from 'react';
import { IconWandMagicSparkles } from '../icons';
import type { AiEntity, AiMessage, AiMessagePart } from '../../core/types';
import { useLabels } from '../../i18n/context';
import { AiMessagePartRenderer } from '../parts/AiMessagePartRenderer';
import type { RenderPartFn } from '../parts/AiMessagePartRenderer';
import styles from './AiMessageBubble.module.css';

type Props = {
  message: AiMessage;
  onProposalConfirm: (proposalId: string, payload: unknown) => void;
  onProposalCancel: (proposalId: string) => void;
  /** Override the assistant avatar icon. Pass any ReactNode — an SVG, img, or component. Defaults to a brain icon. */
  assistantIcon?: ReactNode;
  /** Makes entity cards clickable — forwarded to every AiMessagePartRenderer. */
  onEntityClick?: (entity: AiEntity, entityType?: string) => void;
  /** Custom part renderer — forwarded to every AiMessagePartRenderer. */
  renderPart?: RenderPartFn;
};

/** Part types that read as prose and stay inside the padded chat bubble. */
const INLINE_PART_TYPES = new Set(['text', 'error', 'activity']);

/** Cards, tables and custom parts render full-width outside the bubble chrome. */
function isBlockPart(part: AiMessagePart): boolean {
  return !INLINE_PART_TYPES.has(part.type);
}

type Segment = { block: boolean; parts: { part: AiMessagePart; index: number }[] };

/** Groups consecutive parts so inline runs share one bubble and block parts stand alone. */
function toSegments(parts: AiMessagePart[]): Segment[] {
  const segments: Segment[] = [];
  parts.forEach((part, index) => {
    const block = isBlockPart(part);
    const last = segments[segments.length - 1];
    // Every block part is its own segment so each card gets full width and its own spacing.
    if (last && !block && !last.block) {
      last.parts.push({ part, index });
      return;
    }
    segments.push({ block, parts: [{ part, index }] });
  });
  return segments;
}

export function AiMessageBubble({ message, onProposalConfirm, onProposalCancel, onEntityClick, assistantIcon, renderPart }: Props) {
  const labels = useLabels();
  const isUser = message.role === 'user';
  const segments = toSegments(message.parts);

  const renderOne = (part: AiMessagePart, index: number) => (
    <AiMessagePartRenderer
      key={index}
      part={part}
      onProposalConfirm={onProposalConfirm}
      onProposalCancel={onProposalCancel}
      onEntityClick={onEntityClick}
      renderPart={renderPart}
    />
  );

  return (
    <div className={`${styles.wrapper} ${isUser ? styles.user : styles.assistant}`}>
      {!isUser && (
        <div className={styles.avatar} aria-hidden="true">
          {assistantIcon ?? <IconWandMagicSparkles />}
        </div>
      )}
      <div className={styles.content}>
        {segments.map((segment, i) => (
          <div
            key={i}
            className={segment.block ? styles.block : styles.bubble}
            data-juneau-segment={segment.block ? 'block' : 'bubble'}
          >
            {segment.parts.map(({ part, index }) => renderOne(part, index))}
          </div>
        ))}
        {message.parts.length === 0 && (
          <div className={styles.bubble} data-juneau-segment="bubble">
            <span className={styles.empty} />
          </div>
        )}
      </div>
      {isUser && <div className={styles.avatar}>{labels.userLabel}</div>}
    </div>
  );
}
