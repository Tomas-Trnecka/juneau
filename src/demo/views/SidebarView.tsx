import { useEffect } from 'react';
import { AiSidebar } from '../../components/AiSidebar/AiSidebar';
import { useAiChatContext } from '../../context/AiChatContext';
import { recentInvoices, suggestedQuestions } from '../mockData';
import type { RecentInvoice } from '../mockData';
import styles from './SidebarView.module.css';

export function SidebarView() {
  const { setContext } = useAiChatContext();

  // Tell the AI about the current page on mount
  useEffect(() => {
    setContext({
      page: 'invoices',
      description: 'User is viewing the Invoices dashboard with recent invoice data.',
    });
  }, [setContext]);

  return (
    <div className={styles.layout}>
      <main className={styles.content}>
        <h1 className={styles.pageTitle}>Dashboard</h1>
        <p className={styles.pageSubtitle}>Overview · Q2 2024</p>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Try asking the AI</h2>
          <div className={styles.suggestions}>
            {suggestedQuestions.map(q => (
              <button key={q} className={styles.suggestion}>{q}</button>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Recent Invoices</h2>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Vendor</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map(inv => (
                  <InvoiceRow key={inv.id} invoice={inv} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <AiSidebar />
    </div>
  );
}

function InvoiceRow({ invoice }: { invoice: RecentInvoice }) {
  return (
    <tr>
      <td className={styles.invoiceId}>{invoice.id}</td>
      <td>{invoice.vendor}</td>
      <td>{invoice.amount}</td>
      <td>{invoice.date}</td>
      <td>
        <span className={`${styles.badge} ${styles[`badge--${invoice.status}`]}`}>
          {invoice.status}
        </span>
      </td>
    </tr>
  );
}
