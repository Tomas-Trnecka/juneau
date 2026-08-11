import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBrain } from '@fortawesome/free-solid-svg-icons';
import { useLabels } from '../../i18n/context';
import styles from './AiChatHeader.module.css';

type Props = {
  title?: string;
  onReset?: () => void;
};

export function AiChatHeader({ title, onReset }: Props) {
  const labels = useLabels();

  return (
    <div className={styles.header}>
      <div className={styles.left}>
        <FontAwesomeIcon icon={faBrain} className={styles.icon} />
        <span className={styles.title}>{title ?? labels.sidebarTitle}</span>
      </div>
      {onReset && (
        <button
          className={styles.resetBtn}
          onClick={onReset}
          title={labels.clearConversation}
          aria-label={labels.clearConversation}
        >
          ↺
        </button>
      )}
    </div>
  );
}
