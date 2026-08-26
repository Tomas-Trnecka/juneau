import type { AiEntity, AiEntityBadgeTone, AiEntityPart } from '../../core/types';
import styles from './AiEntityCard.module.css';

type Props = {
  part: AiEntityPart;
  /** Optional click handler — the card becomes interactive when provided */
  onEntityClick?: (entity: AiEntity, entityType?: string) => void;
};

const badgeClass: Record<AiEntityBadgeTone, string> = {
  success: styles.badgeSuccess,
  warning: styles.badgeWarning,
  danger: styles.badgeDanger,
  neutral: styles.badgeNeutral,
};

export function AiEntityCard({ part, onEntityClick }: Props) {
  const { entity, entityType } = part;
  const clickable = onEntityClick !== undefined;

  const body = (
    <>
      <div className={styles.header}>
        <span className={styles.title}>{entity.title}</span>
        {entity.subtitle && <span className={styles.subtitle}>{entity.subtitle}</span>}
      </div>
      {entity.fields && entity.fields.length > 0 && (
        <dl className={styles.fields}>
          {entity.fields.map((field, i) => (
            <div key={i} className={styles.fieldRow}>
              <dt className={styles.fieldLabel}>{field.label}</dt>
              <dd className={styles.fieldValue}>
                {field.badge ? (
                  <span className={`${styles.badge} ${badgeClass[field.badge]}`}>{field.value}</span>
                ) : (
                  field.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </>
  );

  if (clickable) {
    return (
      <button
        type='button'
        className={`${styles.card} ${styles.cardClickable}`}
        onClick={() => onEntityClick(entity, entityType)}
      >
        {body}
      </button>
    );
  }

  return <div className={styles.card}>{body}</div>;
}
