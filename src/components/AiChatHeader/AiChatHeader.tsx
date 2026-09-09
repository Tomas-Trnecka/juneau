import type { ReactNode } from 'react';
import {
  IconArrowRotateLeft,
  IconWandMagicSparkles,
  IconWindowMinimize,
  IconWindowRestore,
} from '../icons';
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
   * Rendered right of the title. Use it for an unread/notification badge.
   * Juneau renders it as given and never interprets it.
   */
  badge?: ReactNode;
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
  badge,
  headerActions,
}: Props) {
  const labels = useLabels();

  return (
    <div className={styles.header} data-juneau="header">
      <div className={styles.left}>
        <span className={styles.icon} aria-hidden="true" data-juneau="header-icon">
          {icon ?? <IconWandMagicSparkles />}
        </span>
        <span className={styles.title}>{title ?? labels.sidebarTitle}</span>
        {badge && (
          <span className={styles.badge} data-juneau="header-badge">
            {badge}
          </span>
        )}
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
              data-juneau="header-reset"
            >
              <IconArrowRotateLeft />
            </button>
          )}
          {onMinimize && (
            <button
              className={styles.resetBtn}
              onClick={onMinimize}
              title={isMinimized ? labels.expandSidebar : labels.minimizeSidebar}
              aria-label={isMinimized ? labels.expandSidebar : labels.minimizeSidebar}
              data-juneau="header-minimize"
            >
              {isMinimized ? <IconWindowRestore /> : <IconWindowMinimize />}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
