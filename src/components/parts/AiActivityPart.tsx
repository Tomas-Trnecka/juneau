import type { AiActivityPart as AiActivityPartType } from '../../core/types';
import styles from './AiActivityPart.module.css';

type Props = {
  part: AiActivityPartType;
};

export function AiActivityPart({ part }: Props) {
  return (
    <div className={styles.activity} data-status={part.status} data-juneau="activity-part">
      <span className={styles.indicator} aria-hidden="true" />

      <div className={styles.content}>
        <div className={styles.title}>{part.title}</div>

        {part.description && (
          <div className={styles.description}>{part.description}</div>
        )}
      </div>
    </div>
  );
}
