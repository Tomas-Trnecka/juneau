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

/** Cards (tables, entities, proposals, custom parts) render full-width outside the bubble. */
function isCardPart(part: AiMessagePart): boolean {
  return !INLINE_PART_TYPES.has(part.type);
}

type Segment = { card: boolean; parts: { part: AiMessagePart; index: number }[] };

/** Groups consecutive parts so prose runs share one bubble and each card stands alone. */
function toSegments(parts: AiMessagePart[]): Segment[] {
  const segments: Segment[] = [];
  parts.forEach((part, index) => {
    const card = isCardPart(part);
    const last = segments[segments.length - 1];
    // Each card is its own segment so it gets full width and its own spacing.
    if (last && !card && !last.card) {
      last.parts.push({ part, index });
      return;
    }
    segments.push({ card, parts: [{ part, index }] });
  });
  return segments;
}

export function AiMessageBubble({ message, onProposalConfirm, onProposalCancel, onEntityClick, assistantIcon, renderPart }: Props) {
  const labels = useLabels();
  const isUser = message.role === 'user';

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

  // Plain conversational messages keep the classic single-bubble layout untouched —
  // only messages carrying a card opt into the full-width column below.
  const hasCard = message.parts.some(isCardPart);

  return (
    <div
      className={`${styles.wrapper} ${isUser ? styles.user : styles.assistant}`}
      data-juneau="message"
      data-juneau-role={message.role}
    >
      {!isUser && (
        <div className={styles.avatar} aria-hidden="true" data-juneau="assistant-avatar">
          {assistantIcon ?? <IconWandMagicSparkles />}
        </div>
      )}
      {hasCard ? (
        <div className={styles.content}>
          {toSegments(message.parts).map((segment, i) => (
            <div
              key={i}
              className={segment.card ? styles.card : styles.bubble}
              data-juneau-segment={segment.card ? 'card' : 'bubble'}
            >
              {segment.parts.map(({ part, index }) => renderOne(part, index))}
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.bubble} data-juneau-segment="bubble">
          {message.parts.map((part, i) => renderOne(part, i))}
          {message.parts.length === 0 && <span className={styles.empty} />}
        </div>
      )}
      {isUser && <div className={styles.avatar}>{labels.userLabel}</div>}
    </div>
  );
}
