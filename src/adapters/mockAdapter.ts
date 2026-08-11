import { delay } from '../core/stream';
import type { AiBackendAdapter, AiAdapterInput, AiStreamEvent } from '../core/types';

/**
 * Simulates AI streaming responses for development and demo purposes.
 * Replace with a real adapter (OpenAI, Claude, custom backend) in production.
 */
export const mockAdapter: AiBackendAdapter = {
  async *sendMessage(input: AiAdapterInput): AsyncIterable<AiStreamEvent> {
    const lastUserMessage = [...input.messages].reverse().find(m => m.role === 'user');
    const text = lastUserMessage?.parts.find(p => p.type === 'text');
    const query = text?.type === 'text' ? text.text.toLowerCase() : '';

    if (query.includes('q2') || query.includes('dodavatel') || query.includes('supplier') || query.includes('spend')) {
      yield* scenarioSpendBySupplier();
    } else if (query.includes('trend') || query.includes('monthly') || query.includes('měsíc')) {
      yield* scenarioMonthlyTrend();
    } else if (query.includes('help') || query.includes('pomoc') || query.includes('what can')) {
      yield* scenarioHelp();
    } else {
      yield* scenarioDefault(query);
    }
  }
};

async function* scenarioSpendBySupplier(): AsyncIterable<AiStreamEvent> {
  yield* streamText('Připravuji přehled výdajů za IT v Q2…', 40);
  await delay(600);
  yield* streamText(' Načítám data ze systému.', 40);
  await delay(400);

  yield {
    type: 'part',
    part: {
      type: 'table',
      columns: ['Dodavatel', 'Kategorie', 'Celkem (CZK)', 'Faktury'],
      rows: [
        { Dodavatel: 'Microsoft s.r.o.', Kategorie: 'Software', 'Celkem (CZK)': '842 400', Faktury: '3' },
        { Dodavatel: 'AWS EMEA SARL', Kategorie: 'Cloud', 'Celkem (CZK)': '614 800', Faktury: '6' },
        { Dodavatel: 'DataSys a.s.', Kategorie: 'Konzultace', 'Celkem (CZK)': '390 000', Faktury: '2' },
        { Dodavatel: 'NetFlow s.r.o.', Kategorie: 'Infrastruktura', 'Celkem (CZK)': '218 500', Faktury: '4' },
        { Dodavatel: 'SoftLicence EU', Kategorie: 'Software', 'Celkem (CZK)': '97 200', Faktury: '1' }
      ]
    }
  };

  await delay(500);
  yield* streamText('\n\nCelkové IT výdaje v Q2 dosáhly **2 162 900 CZK** — nárůst o 12 % oproti Q1.', 30);
  await delay(300);

  yield {
    type: 'part',
    part: {
      type: 'proposal',
      proposal: {
        id: 'save-it-q2-report',
        title: 'Uložit jako opakovaný report',
        description: 'Tento přehled IT výdajů podle dodavatelů se automaticky vygeneruje každý kvartál.',
        confirmLabel: 'Uložit report',
        cancelLabel: 'Zrušit',
        payload: { reportType: 'spend-by-supplier', period: 'Q2', category: 'IT' }
      }
    }
  };

  yield { type: 'done' };
}

async function* scenarioMonthlyTrend(): AsyncIterable<AiStreamEvent> {
  yield* streamText('Generuji měsíční trend výdajů…', 40);
  await delay(700);

  yield {
    type: 'part',
    part: {
      type: 'table',
      columns: ['Měsíc', 'Výdaje (CZK)', 'Faktury', 'Změna'],
      rows: [
        { 'Měsíc': 'Leden', 'Výdaje (CZK)': '1 240 000', 'Faktury': '18', 'Změna': '—' },
        { 'Měsíc': 'Únor', 'Výdaje (CZK)': '980 000', 'Faktury': '14', 'Změna': '-21 %' },
        { 'Měsíc': 'Březen', 'Výdaje (CZK)': '1 560 000', 'Faktury': '22', 'Změna': '+59 %' },
        { 'Měsíc': 'Duben', 'Výdaje (CZK)': '1 120 000', 'Faktury': '16', 'Změna': '-28 %' },
        { 'Měsíc': 'Květen', 'Výdaje (CZK)': '1 380 000', 'Faktury': '20', 'Změna': '+23 %' },
        { 'Měsíc': 'Červen', 'Výdaje (CZK)': '1 650 000', 'Faktury': '25', 'Změna': '+20 %' }
      ]
    }
  };

  await delay(400);
  yield* streamText('\n\nVýdaje mají od března rostoucí trend. Největší spike byl v březnu (+59 %).', 30);
  yield { type: 'done' };
}

async function* scenarioHelp(): AsyncIterable<AiStreamEvent> {
  yield* streamText('Jsem váš AI asistent pro finanční analytics. Mohu vám pomoci s:\n\n', 35);
  await delay(200);
  yield* streamText('• **Přehledy výdajů** — podle dodavatele, kategorie nebo období\n', 25);
  await delay(150);
  yield* streamText('• **Měsíční trendy** — analýza vývoje nákladů\n', 25);
  await delay(150);
  yield* streamText('• **Anomálie** — detekce neobvyklých výdajů\n', 25);
  await delay(150);
  yield* streamText('• **Reporty** — vytvoření a uložení opakovaných přehledů\n', 25);
  await delay(200);
  yield* streamText('\nZkuste se zeptat například: *"Kolik jsme utratili za IT v Q2 podle dodavatelů?"*', 30);
  yield { type: 'done' };
}

async function* scenarioDefault(query: string): AsyncIterable<AiStreamEvent> {
  yield* streamText(`Rozumím, hledáte informace k tématu "${query || 'vašeho dotazu'}".`, 35);
  await delay(500);
  yield* streamText('\n\nPro detailní analýzu zkuste upřesnit:', 35);
  await delay(300);
  yield* streamText('\n• Jaké období vás zajímá? (Q1, Q2, konkrétní měsíc)\n• Jakou kategorii? (IT, Marketing, Provoz)\n• Chcete přehled podle dodavatele nebo kategorie?', 20);
  yield { type: 'done' };
}

async function* streamText(text: string, chunkDelayMs: number): AsyncIterable<AiStreamEvent> {
  const chunkSize = 3;
  for (let i = 0; i < text.length; i += chunkSize) {
    yield { type: 'text', text: text.slice(i, i + chunkSize) };
    await delay(chunkDelayMs);
  }
}
