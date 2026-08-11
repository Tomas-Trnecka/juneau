import { useEffect, useRef } from 'react';
import { AiChat } from '../../components/AiChat/AiChat';
import { AiChatHeader } from '../../components/AiChatHeader/AiChatHeader';
import { useAiChat } from '../../hooks/useAiChat';
import { dashboardAdapter } from '../../adapters/dashboardAdapter';
import { kpiCards } from '../mockData';
import type { KpiCard } from '../mockData';
import styles from './DashboardView.module.css';

export function DashboardView() {
  const initSent = useRef(false);

  const {
    messages,
    input,
    setInput,
    sendMessage,
    sendGreeting,
    isLoading,
    error,
    confirmProposal,
    cancelProposal,
  } = useAiChat({
    adapter: dashboardAdapter,
    onProposalConfirm: (id, payload) => console.log('Confirmed:', id, payload),
    onProposalCancel: (id) => console.log('Cancelled:', id),
  });

  // sendGreeting fires once on mount — the ref guards against StrictMode double-invoke
  useEffect(() => {
    if (initSent.current) return;
    initSent.current = true;
    sendGreeting('dashboard-init');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.layout}>
      <aside className={styles.kpiColumn}>
        <h2 className={styles.kpiHeading}>Overview · Q2 2024</h2>
        {kpiCards.map(card => (
          <KpiTile key={card.label} card={card} />
        ))}
      </aside>

      <section className={styles.chatColumn}>
        <div className={styles.chatCard}>
          <AiChatHeader />
          <AiChat
            messages={messages}
            input={input}
            isLoading={isLoading}
            error={error}
            onInputChange={setInput}
            onSend={sendMessage}
            onProposalConfirm={confirmProposal}
            onProposalCancel={cancelProposal}
            placeholder="Odpovězte nebo se zeptejte na cokoliv…"
          />
        </div>
      </section>
    </div>
  );
}

function KpiTile({ card }: { card: KpiCard }) {
  return (
    <div className={styles.kpiCard}>
      <span className={styles.kpiLabel}>{card.label}</span>
      <span className={styles.kpiValue}>{card.value}</span>
      <span className={`${styles.kpiChange} ${card.positive ? styles.positive : styles.negative}`}>
        {card.positive ? '+' : '-'} {card.change}
      </span>
    </div>
  );
}
