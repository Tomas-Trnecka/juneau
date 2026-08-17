import type { ReactNode } from 'react';
import { IconWandMagicSparkles, IconWindowMinimize, IconWindowRestore } from '../icons';
import { useLabels } from '../../i18n/context';
import styles from './AiChatHeader.module.css';

type Props = {
  title?: string;
  onMinimize?: () => void;
  isMinimized?: boolean;
  /** Override the avatar icon. Pass any ReactNode — an SVG, img, or component. Defaults to a wand icon. */
  icon?: ReactNode;
};

export function AiChatHeader({ title, onMinimize, isMinimized, icon }: Props) {
  const labels = useLabels();

  return (
    <div className={styles.header}>
      <div className={styles.left}>
        <span className={styles.icon} aria-hidden="true">
          {icon ?? <IconWandMagicSparkles />}
        </span>
        <span className={styles.title}>{title ?? labels.sidebarTitle}</span>
      </div>
      {onMinimize && (
        <div className={styles.actions}>
          <button
            className={styles.resetBtn}
            onClick={onMinimize}
            title={isMinimized ? labels.expandSidebar : labels.minimizeSidebar}
            aria-label={isMinimized ? labels.expandSidebar : labels.minimizeSidebar}
          >
            {isMinimized ? <IconWindowRestore /> : <IconWindowMinimize />}
          </button>
        </div>
      )}
    </div>
  );
}
