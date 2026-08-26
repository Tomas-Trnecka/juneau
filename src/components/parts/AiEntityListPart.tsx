import type { AiEntity, AiEntityListPart as AiEntityListPartType } from '../../core/types';
import { AiEntityCard } from './AiEntityCard';
import styles from './AiEntityListPart.module.css';

type Props = {
  part: AiEntityListPartType;
  /** Optional click handler — cards become interactive when provided */
  onEntityClick?: (entity: AiEntity, entityType?: string) => void;
};

export function AiEntityListPart({ part, onEntityClick }: Props) {
  return (
    <div className={styles.list}>
      {part.title && <span className={styles.listTitle}>{part.title}</span>}
      {part.entities.map((entity, i) => (
        <AiEntityCard
          key={entity.id ?? i}
          part={{ type: 'entity', entity, entityType: part.entityType }}
          onEntityClick={onEntityClick}
        />
      ))}
    </div>
  );
}
