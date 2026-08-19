import type { KeyboardEvent, ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import {
  IconPaperPlane,
  IconPaperclip,
  IconBolt,
  IconPlus,
  IconClockRotateLeft,
  IconScroll,
} from '../icons';
import { useLabels } from '../../i18n/context';
import styles from './AiInput.module.css';

export type AiInputAction = {
  /** Icon rendered inside the button. */
  icon: ReactNode;
  /** Visible label and aria-label for the button. */
  label: string;
  onClick?: () => void;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  /** When provided, the send button becomes a stop button while isLoading is true. */
  onStop?: () => void;
  isLoading: boolean;
  /** Overrides the `inputPlaceholder` label for this specific instance. */
  placeholder?: string;
  /**
   * Toolbar action buttons rendered left of the send button.
   * Pass an empty array to hide the toolbar entirely.
   * Defaults to five built-in actions (attach, quick actions, new, history, rules).
   */
  actions?: AiInputAction[];
  /** Override the send button icon. Defaults to a paper-plane icon. */
  sendIcon?: ReactNode;
};

export function AiInput({ value, onChange, onSend, onStop, isLoading, placeholder, actions, sendIcon }: Props) {
  const labels = useLabels();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wasLoadingRef = useRef(false);

  // Restore focus when streaming finishes. The textarea stays enabled during
  // streaming so the user can keep typing, but if focus was lost anyway
  // (e.g. the user clicked the stop button), give it back.
  useEffect(() => {
    if (wasLoadingRef.current && !isLoading) {
      textareaRef.current?.focus();
    }
    wasLoadingRef.current = isLoading;
  }, [isLoading]);

  const defaultActions: AiInputAction[] = [
    { icon: <IconPaperclip />,        label: labels.actionAddFile },
    { icon: <IconBolt />,             label: labels.actionQuickActions },
    { icon: <IconPlus />,             label: labels.actionNew },
    { icon: <IconClockRotateLeft />,  label: labels.actionHistory },
    { icon: <IconScroll />,           label: labels.actionRules },
  ];

  const resolvedActions = actions ?? defaultActions;

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Typing stays enabled during streaming, but Enter must not send —
      // useAiChat also guards this, this is just belt and braces.
      if (!isLoading) onSend();
    }
  };

  return (
    <div className={styles.wrapper}>
      <textarea
        ref={textareaRef}
        className={styles.textarea}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? labels.inputPlaceholder}
        rows={3}
        aria-label={labels.sendMessage}
      />

      <div className={styles.toolbar}>
        {resolvedActions.length > 0 && (
          <div className={styles.actions}>
            {resolvedActions.map((action, i) => (
              <button
                key={i}
                className={styles.actionBtn}
                type="button"
                disabled={isLoading}
                aria-label={action.label}
                onClick={action.onClick}
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        )}

        {isLoading && onStop ? (
          <button
            className={styles.stopBtn}
            onClick={onStop}
            aria-label={labels.stopMessage}
            type="button"
          >
            <svg className={styles.stopIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
            <span>{labels.stopMessage}</span>
          </button>
        ) : (
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
              sendIcon ?? <IconPaperPlane />
            )}
            <span>{labels.sendMessage}</span>
          </button>
        )}
      </div>
    </div>
  );
}
