import type { KeyboardEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPaperclip,
  faBolt,
  faPlus,
  faClockRotateLeft,
  faScroll,
  faPaperPlane,
} from '@fortawesome/free-solid-svg-icons';
import { useLabels } from '../../i18n/context';
import styles from './AiInput.module.css';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  /** Overrides the `inputPlaceholder` label for this specific instance. */
  placeholder?: string;
};

export function AiInput({ value, onChange, onSend, isLoading, placeholder }: Props) {
  const labels = useLabels();

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className={styles.wrapper}>
      <textarea
        className={styles.textarea}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? labels.inputPlaceholder}
        rows={3}
        disabled={isLoading}
        aria-label={labels.sendMessage}
      />

      <div className={styles.toolbar}>
        <div className={styles.actions}>
          <button className={styles.actionBtn} type="button" disabled={isLoading} aria-label={labels.actionAddFile}>
            <FontAwesomeIcon icon={faPaperclip} />
            <span>{labels.actionAddFile}</span>
          </button>
          <button className={styles.actionBtn} type="button" disabled={isLoading} aria-label={labels.actionQuickActions}>
            <FontAwesomeIcon icon={faBolt} />
            <span>{labels.actionQuickActions}</span>
          </button>
          <button className={styles.actionBtn} type="button" disabled={isLoading} aria-label={labels.actionNew}>
            <FontAwesomeIcon icon={faPlus} />
            <span>{labels.actionNew}</span>
          </button>
          <button className={styles.actionBtn} type="button" disabled={isLoading} aria-label={labels.actionHistory}>
            <FontAwesomeIcon icon={faClockRotateLeft} />
            <span>{labels.actionHistory}</span>
          </button>
          <button className={styles.actionBtn} type="button" disabled={isLoading} aria-label={labels.actionRules}>
            <FontAwesomeIcon icon={faScroll} />
            <span>{labels.actionRules}</span>
          </button>
        </div>

        <button
          className={styles.sendBtn}
          onClick={onSend}
          disabled={isLoading || !value.trim()}
          aria-label={labels.sendMessage}
          type="button"
        >
          {isLoading ? (
            <svg className={styles.spinnerIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="12" />
            </svg>
          ) : (
            <FontAwesomeIcon icon={faPaperPlane} />
          )}
          <span>{labels.sendMessage}</span>
        </button>
      </div>
    </div>
  );
}
