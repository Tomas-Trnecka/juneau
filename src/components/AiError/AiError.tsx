import { useLabels } from '../../i18n/context';
import styles from './AiError.module.css';

type Props = {
  message: string;
  onDismiss?: () => void;
};

export function AiError({ message, onDismiss }: Props) {
  const labels = useLabels();

  return (
    <div className={styles.wrapper} role="alert">
      <svg className={styles.icon} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
      <span className={styles.message}>{message}</span>
      {onDismiss && (
        <button className={styles.dismiss} onClick={onDismiss} aria-label={labels.errorDismiss}>
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
          </svg>
        </button>
      )}
    </div>
  );
}
