import { delay, getMessageText } from '../core/stream';
import type { AiBackendAdapter, AiAdapterInput, AiStreamEvent } from '../core/types';

/**
 * Simulates AI streaming responses for development and testing.
 * Triggers different scenarios based on keywords in the last user message.
 * Replace with a real adapter (OpenAI, Anthropic, custom backend) in production.
 */
export const mockAdapter: AiBackendAdapter = {
  async *sendMessage(input: AiAdapterInput): AsyncIterable<AiStreamEvent> {
    const lastUserMessage = [...input.messages].reverse().find(m => m.role === 'user');
    const query = lastUserMessage ? getMessageText(lastUserMessage).toLowerCase() : '';

    if (query.includes('activity') || query.includes('progress') || query.includes('document') || query.includes('dokument')) {
      yield* scenarioActivity();
    } else if (query.includes('table') || query.includes('data') || query.includes('list') || query.includes('show')) {
      yield* scenarioTable();
    } else if (query.includes('proposal') || query.includes('suggest') || query.includes('recommend')) {
      yield* scenarioProposal();
    } else if (query.includes('entity') || query.includes('card') || query.includes('detail') || query.includes('find')) {
      yield* scenarioEntity();
    } else if (query.includes('help') || query.includes('what can') || query.includes('how do')) {
      yield* scenarioHelp();
    } else if (query.includes('error') || query.includes('fail') || query.includes('break')) {
      yield* scenarioError();
    } else {
      yield* scenarioDefault(query);
    }
  }
};

async function* scenarioActivity(): AsyncIterable<AiStreamEvent> {
  yield {
    type: 'part',
    part: {
      type: 'activity',
      id: 'select-skill',
      title: 'Selecting skill',
      description: 'Looking for the best skill for this request.',
      status: 'running',
    },
  };

  await delay(700);

  yield {
    type: 'part',
    part: {
      type: 'activity',
      id: 'select-skill',
      title: 'Skill selected',
      description: 'Using Document Search.',
      status: 'done',
    },
  };

  await delay(300);

  yield {
    type: 'part',
    part: {
      type: 'activity',
      id: 'search-document',
      title: 'Searching document',
      description: 'Looking up document by ID.',
      status: 'running',
    },
  };

  await delay(900);

  yield {
    type: 'part',
    part: {
      type: 'activity',
      id: 'search-document',
      title: 'Document found',
      description: 'Found document INV-2024-0894.',
      status: 'done',
    },
  };

  await delay(300);

  yield* streamText('\nFound document **INV-2024-0894** from **DataSys a.s.** for **CZK 390 000**.', 25);
  yield { type: 'done' };
}

async function* scenarioTable(): AsyncIterable<AiStreamEvent> {
  yield* streamText('Here is a summary of the data you requested:\n\n', 30);
  await delay(400);

  yield {
    type: 'part',
    part: {
      type: 'table',
      columns: ['Name', 'Category', 'Value', 'Status'],
      rows: [
        { Name: 'Item Alpha',   Category: 'Type A', Value: '1,200', Status: 'Active' },
        { Name: 'Item Beta',    Category: 'Type B', Value: '840',   Status: 'Active' },
        { Name: 'Item Gamma',   Category: 'Type A', Value: '3,050', Status: 'Pending' },
        { Name: 'Item Delta',   Category: 'Type C', Value: '610',   Status: 'Inactive' },
        { Name: 'Item Epsilon', Category: 'Type B', Value: '2,200', Status: 'Active' },
      ]
    }
  };

  await delay(300);
  yield* streamText('\nTotal across all entries: **7,900** — Type A accounts for the largest share at 53%.', 25);
  yield { type: 'done' };
}

async function* scenarioProposal(): AsyncIterable<AiStreamEvent> {
  yield* streamText('Based on the current data, I have a suggestion for you:\n\n', 30);
  await delay(500);

  yield {
    type: 'part',
    part: {
      type: 'proposal',
      proposal: {
        id: 'mock-proposal-1',
        title: 'Save this as a recurring report',
        description: 'This summary can be automatically generated on a schedule so you always have up-to-date insights.',
        confirmLabel: 'Save report',
        cancelLabel: 'Dismiss',
        payload: { reportType: 'summary', schedule: 'weekly' }
      }
    }
  };

  yield { type: 'done' };
}

async function* scenarioEntity(): AsyncIterable<AiStreamEvent> {
  yield* streamText('I found these records matching your request:\n\n', 30);
  await delay(400);

  yield {
    type: 'part',
    part: {
      type: 'entity-list',
      title: '2 records found',
      entityType: 'record',
      entities: [
        {
          id: 'rec-2024-0894',
          title: 'REC-2024-0894',
          subtitle: 'DataSys a.s.',
          fields: [
            { label: 'Amount', value: 'CZK 390 000' },
            { label: 'Due date', value: '2024-08-15' },
            { label: 'Status', value: 'Approved', badge: 'success' },
          ],
        },
        {
          id: 'rec-2024-0895',
          title: 'REC-2024-0895',
          subtitle: 'NetFlow s.r.o.',
          fields: [
            { label: 'Amount', value: 'CZK 218 500' },
            { label: 'Due date', value: '2024-08-22' },
            { label: 'Status', value: 'Pending', badge: 'warning' },
          ],
        },
      ],
    },
  };

  await delay(300);

  yield* streamText('\nHere is the detail of the first one:\n\n', 25);
  await delay(300);

  yield {
    type: 'part',
    part: {
      type: 'entity',
      entityType: 'record',
      entity: {
        id: 'rec-2024-0894',
        title: 'REC-2024-0894',
        subtitle: 'DataSys a.s. — Consulting',
        fields: [
          { label: 'Amount', value: 'CZK 390 000' },
          { label: 'Issued', value: '2024-07-15' },
          { label: 'Due date', value: '2024-08-15' },
          { label: 'Status', value: 'Approved', badge: 'success' },
        ],
      },
    },
  };

  yield { type: 'done' };
}

async function* scenarioHelp(): AsyncIterable<AiStreamEvent> {
  yield* streamText('I\'m a general-purpose AI assistant. Here\'s what I can help with:\n\n', 30);
  await delay(200);
  yield* streamText('- **Summarise data** — ask me to show, list, or summarise information\n', 22);
  await delay(150);
  yield* streamText('- **Make suggestions** — ask me to recommend or propose something\n', 22);
  await delay(150);
  yield* streamText('- **Answer questions** — ask me anything and I\'ll do my best\n', 22);
  await delay(200);
  yield* streamText('\nTry asking: *"Show me the data"* or *"Can you suggest something?"*', 25);
  yield { type: 'done' };
}

async function* scenarioError(): AsyncIterable<AiStreamEvent> {
  yield* streamText('Attempting to process your request…', 30);
  await delay(800);
  yield { type: 'error', message: 'Simulated error: the upstream service returned an unexpected response.' };
}

async function* scenarioDefault(query: string): AsyncIterable<AiStreamEvent> {
  yield* streamText(`Got it — you asked about *"${query || 'your request'}"*.\n\n`, 30);
  await delay(400);
  yield* streamText('I\'m a **mock adapter** used for development. I respond to a few trigger words:\n\n', 25);
  await delay(200);
  yield* streamText('- Say **"show"**, **"list"**, **"data"**, or **"table"** → renders a data table\n', 22);
  await delay(150);
  yield* streamText('- Say **"suggest"**, **"recommend"**, or **"proposal"** → renders a proposal card\n', 22);
  await delay(150);
  yield* streamText('- Say **"entity"**, **"card"**, **"detail"**, or **"find"** → renders entity cards\n', 22);
  await delay(150);
  yield* streamText('- Say **"help"** or **"what can you do"** → shows capabilities\n', 22);
  await delay(150);
  yield* streamText('- Say **"error"** or **"fail"** → simulates an error response\n', 22);
  yield { type: 'done' };
}

async function* streamText(text: string, chunkDelayMs: number): AsyncIterable<AiStreamEvent> {
  const chunkSize = 3;
  for (let i = 0; i < text.length; i += chunkSize) {
    yield { type: 'text', text: text.slice(i, i + chunkSize) };
    await delay(chunkDelayMs);
  }
}
