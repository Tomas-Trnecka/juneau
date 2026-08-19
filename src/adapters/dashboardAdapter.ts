import { delay, getMessageText } from '../core/stream';
import type { AiBackendAdapter, AiAdapterInput, AiStreamEvent } from '../core/types';

/**
 * Mock adapter for the dashboard (proactive) demo.
 *
 * On first load the dashboard sends a synthetic "init" message so the AI
 * can greet the user with a contextual summary — no user input required.
 * Subsequent messages fall through to the standard keyword scenarios.
 */
export const dashboardAdapter: AiBackendAdapter = {
  async *sendMessage(input: AiAdapterInput): AsyncIterable<AiStreamEvent> {
    const lastMessage = [...input.messages].reverse().find(m => m.role === 'user');
    const query = lastMessage ? getMessageText(lastMessage).toLowerCase() : '';

    if (query === 'dashboard-init') {
      yield* scenarioGreeting();
    } else if (query.includes('faktura') || query.includes('invoice') || query.includes('schválit') || query.includes('approve')) {
      yield* scenarioInvoiceDetail();
    } else if (query.includes('q2') || query.includes('dodavatel') || query.includes('supplier') || query.includes('spend')) {
      yield* scenarioSpendSummary();
    } else {
      yield* scenarioDefault(query);
    }
  },
};

async function* scenarioGreeting(): AsyncIterable<AiStreamEvent> {
  await delay(600);
  yield* streamText('Dobrý den! Zde je váš přehled za dnešek.\n\n', 18);
  await delay(200);
  yield* streamText('Máte **4 nové faktury** k zpracování. ', 22);
  await delay(100);
  yield* streamText('Dvě jsem automaticky schválil na základě vašich pravidel, ', 22);
  yield* streamText('zbývající dvě vyžadují vaši pozornost.\n\n', 22);
  await delay(300);

  yield {
    type: 'part',
    part: {
      type: 'table',
      columns: ['Faktura', 'Dodavatel', 'Částka', 'Stav'],
      rows: [
        { Faktura: 'INV-2024-0892', Dodavatel: 'Microsoft s.r.o.', Částka: 'CZK 284 800', Stav: 'Auto-schváleno' },
        { Faktura: 'INV-2024-0893', Dodavatel: 'AWS EMEA SARL',    Částka: 'CZK 102 400', Stav: 'Auto-schváleno' },
        { Faktura: 'INV-2024-0894', Dodavatel: 'DataSys a.s.',     Částka: 'CZK 390 000', Stav: 'Ke schválení' },
        { Faktura: 'INV-2024-0895', Dodavatel: 'NetFlow s.r.o.',   Částka: 'CZK 218 500', Stav: 'Ke schválení' },
      ],
    },
  };

  await delay(400);
  yield* streamText('\nFaktury INV-2024-0894 a INV-2024-0895 překračují váš automatický limit. Chcete je schválit nyní?', 20);
  await delay(200);

  yield {
    type: 'part',
    part: {
      type: 'proposal',
      proposal: {
        id: 'approve-pending-invoices',
        title: 'Schválit obě faktury',
        description: 'DataSys a.s. (CZK 390 000) a NetFlow s.r.o. (CZK 218 500) — celkem CZK 608 500.',
        confirmLabel: 'Schválit',
        cancelLabel: 'Zkontrolovat ručně',
        payload: { invoiceIds: ['INV-2024-0894', 'INV-2024-0895'] },
      },
    },
  };

  yield { type: 'done' };
}

async function* scenarioInvoiceDetail(): AsyncIterable<AiStreamEvent> {
  yield* streamText('Zobrazuji detail faktur čekajících na schválení.\n\n', 25);
  await delay(500);

  yield {
    type: 'part',
    part: {
      type: 'table',
      columns: ['Položka', 'Množství', 'Jednotková cena', 'Celkem'],
      rows: [
        { Položka: 'Konzultační služby — červen', Množství: '10 dní', 'Jednotková cena': 'CZK 39 000', Celkem: 'CZK 390 000' },
      ],
    },
  };

  await delay(300);
  yield* streamText('\nDodavatel DataSys a.s. má historicky 100% spolehlivost. Doporučuji schválit.', 25);
  yield { type: 'done' };
}

async function* scenarioSpendSummary(): AsyncIterable<AiStreamEvent> {
  yield* streamText('Celkové výdaje za Q2 podle dodavatelů:\n\n', 25);
  await delay(500);

  yield {
    type: 'part',
    part: {
      type: 'table',
      columns: ['Dodavatel', 'Kategorie', 'Celkem (CZK)'],
      rows: [
        { Dodavatel: 'Microsoft s.r.o.', Kategorie: 'Software',       'Celkem (CZK)': '842 400' },
        { Dodavatel: 'AWS EMEA SARL',    Kategorie: 'Cloud',          'Celkem (CZK)': '614 800' },
        { Dodavatel: 'DataSys a.s.',     Kategorie: 'Konzultace',     'Celkem (CZK)': '390 000' },
        { Dodavatel: 'NetFlow s.r.o.',   Kategorie: 'Infrastruktura', 'Celkem (CZK)': '218 500' },
      ],
    },
  };

  await delay(300);
  yield* streamText('\nCelkem CZK 2 065 700 — o 8 % méně než Q1.', 25);
  yield { type: 'done' };
}

async function* scenarioDefault(query: string): AsyncIterable<AiStreamEvent> {
  yield* streamText(`Rozumím, hledáte informace k tématu „${query || 'vašeho dotazu'}".`, 25);
  await delay(400);
  yield* streamText('\n\nZkuste se zeptat například:\n• Schválit faktury\n• Výdaje za Q2 podle dodavatelů', 20);
  yield { type: 'done' };
}

async function* streamText(text: string, chunkDelayMs: number): AsyncIterable<AiStreamEvent> {
  const chunkSize = 3;
  for (let i = 0; i < text.length; i += chunkSize) {
    yield { type: 'text', text: text.slice(i, i + chunkSize) };
    await delay(chunkDelayMs);
  }
}
