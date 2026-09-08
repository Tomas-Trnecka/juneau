import { useLabels } from '../../i18n/context';
import styles from './AiTypingIndicator.module.css';

type Props = {
  /** When true, shows a "Connecting…" label instead of just the dots. */
  connecting?: boolean;
};

export function AiTypingIndicator({ connecting = false }: Props) {
  const labels = useLabels();

  return (
    <div
      className={styles.wrapper}
      aria-label={connecting ? labels.connectingMessage : labels.typingMessage}
      data-juneau="typing-indicator"
    >
      <span className={styles.dot} />
      <span className={styles.dot} />
      <span className={styles.dot} />
      {connecting && (
        <span className={styles.connectingLabel}>{labels.connectingMessage}</span>
      )}
    </div>
  );
}
