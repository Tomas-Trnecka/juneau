import type { ReactNode } from 'react';
import { IconBrain, IconArrowRotateLeft } from '../icons';
import { useLabels } from '../../i18n/context';
import styles from './AiChatHeader.module.css';

type Props = {
  title?: string;
  onReset?: () => void;
  /** Override the avatar icon. Pass any ReactNode — an SVG, img, or component. Defaults to a brain icon. */
  icon?: ReactNode;
};

export function AiChatHeader({ title, onReset, icon }: Props) {
  const labels = useLabels();

  return (
    <div className={styles.header}>
      <div className={styles.left}>
        <span className={styles.icon} aria-hidden="true">
          {icon ?? <IconBrain />}
        </span>
        <span className={styles.title}>{title ?? labels.sidebarTitle}</span>
      </div>
      {onReset && (
        <button
          className={styles.resetBtn}
          onClick={onReset}
          title={labels.clearConversation}
          aria-label={labels.clearConversation}
        >
          <IconArrowRotateLeft />
        </button>
      )}
    </div>
  );
}
