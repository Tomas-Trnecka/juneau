import type { AiChatSummary } from '../../core/types';
import { useLabels } from '../../i18n/context';
import styles from './AiChatHistoryList.module.css';

type Props = {
  /** Stored chats to display — most recently updated first is recommended (see `trimChats`) */
  chats: AiChatSummary[];
  /** Called with the chat id when the user picks a chat */
  onSelect: (chatId: string) => void;
  /** Highlights the currently open chat, if any */
  activeChatId?: string;
  /** If provided, shows a delete button on each row */
  onDelete?: (chatId: string) => void;
};

export function AiChatHistoryList({ chats, onSelect, activeChatId, onDelete }: Props) {
  const labels = useLabels();

  if (chats.length === 0) {
    return <p className={styles.empty}>{labels.historyEmpty}</p>;
  }

  return (
    <ul className={styles.list} data-juneau="history-list">
      {chats.map(chat => (
        <li key={chat.id} className={styles.item}>
          <button
            className={chat.id === activeChatId ? `${styles.chat} ${styles.chatActive}` : styles.chat}
            onClick={() => onSelect(chat.id)}
          >
            <span className={styles.title}>{chat.title}</span>
            <span className={styles.date}>
              {chat.updatedAt.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
            </span>
          </button>
          {onDelete && (
            <button
              className={styles.delete}
              onClick={() => onDelete(chat.id)}
              aria-label={labels.historyDeleteChat}
            >
              <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
              </svg>
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
