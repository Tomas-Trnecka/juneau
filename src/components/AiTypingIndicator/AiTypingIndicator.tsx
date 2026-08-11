import styles from './AiTypingIndicator.module.css';

export function AiTypingIndicator() {
  return (
    <div className={styles.wrapper} aria-label='Assistant is typing'>
      <span className={styles.dot} />
      <span className={styles.dot} />
      <span className={styles.dot} />
    </div>
  );
}
