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
  /** Called when the reset button is clicked. When provided, a reset button is shown. */
  onReset?: () => void;
  /**
   * Extra controls rendered left of the built-in reset/minimize buttons.
   * Juneau renders them as given and never interprets them — the consumer owns their behaviour.
   */
  headerActions?: ReactNode;
};

export function AiChatHeader({
  title,
  onMinimize,
  isMinimized,
  icon,
  onReset,
  headerActions,
}: Props) {
  const labels = useLabels();

  return (
    <div className={styles.header}>
      <div className={styles.left}>
        <span className={styles.icon} aria-hidden="true">
          {icon ?? <IconWandMagicSparkles />}
        </span>
        <span className={styles.title}>{title ?? labels.sidebarTitle}</span>
      </div>
      {(onMinimize || onReset || headerActions) && (
        <div className={styles.actions}>
          {headerActions}
          {onReset && (
            <button
              className={styles.resetBtn}
              onClick={onReset}
              title={labels.resetConversation}
              aria-label={labels.resetConversation}
            >
              ↺
            </button>
          )}
          {onMinimize && (
            <button
              className={styles.resetBtn}
              onClick={onMinimize}
              title={isMinimized ? labels.expandSidebar : labels.minimizeSidebar}
              aria-label={isMinimized ? labels.expandSidebar : labels.minimizeSidebar}
            >
              {isMinimized ? <IconWindowRestore /> : <IconWindowMinimize />}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
