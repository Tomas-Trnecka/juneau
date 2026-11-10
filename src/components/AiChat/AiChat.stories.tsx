import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { AiChat } from './AiChat';
import { useAiChat } from '../../hooks/useAiChat';
import { mockAdapter } from '../../adapters/mockAdapter';
import { dashboardAdapter } from '../../adapters/dashboardAdapter';
import type { AiMessage } from '../../core/types';

const meta: Meta<typeof AiChat> = {
  title: 'Components/AiChat',
  component: AiChat,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Presentational chat body — message list, input, and error banner with no surrounding chrome.
Contains no state or hooks. The parent calls \`useAiChat\` and passes the results as props.

Use this when you want to embed the chat experience in your own layout — a dashboard card,
a modal, a full-page panel — without the fixed-width sidebar wrapper.

\`AiSidebar\` wraps this component internally. Any change to message rendering, streaming,
or proposal cards automatically applies to both layouts.

\`\`\`tsx
function MyPage() {
  const chat = useAiChat({ adapter: myAdapter });

  return (
    <div className="my-card">
      <AiChat
        messages={chat.messages}
        input={chat.input}
        isLoading={chat.isLoading}
        error={chat.error}
        onInputChange={chat.setInput}
        onSend={chat.sendMessage}
        onProposalConfirm={chat.confirmProposal}
        onProposalCancel={chat.cancelProposal}
      />
    </div>
  );
}
\`\`\`
        `.trim(),
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{
        width: 480,
        height: 520,
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--juneau-color-border)',
        borderRadius: 'var(--juneau-radius-lg)',
        overflow: 'hidden',
        background: 'var(--juneau-color-surface)',
      }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AiChat>;

const emptyState: Pick<React.ComponentProps<typeof AiChat>, 'messages' | 'input' | 'isLoading' | 'isConnecting' | 'error' | 'onInputChange' | 'onSend' | 'onProposalConfirm' | 'onProposalCancel'> = {
  messages: [],
  input: '',
  isLoading: false,
  isConnecting: false,
  error: null,
  onInputChange: () => {},
  onSend: () => {},
  onProposalConfirm: () => {},
  onProposalCancel: () => {},
};

export const Empty: Story = {
  args: emptyState,
  parameters: {
    docs: {
      description: { story: 'Initial empty state — no messages yet.' },
    },
  },
};

export const WithMessages: Story = {
  args: {
    ...emptyState,
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        parts: [{ type: 'text', text: 'How much did we spend on IT in Q2?' }],
        createdAt: new Date(),
      },
      {
        id: 'msg-2',
        role: 'assistant',
        parts: [
          { type: 'text', text: 'Here is the Q2 IT spend breakdown:' },
          {
            type: 'table',
            columns: ['Supplier', 'Total (CZK)'],
            rows: [
              { Supplier: 'Microsoft s.r.o.', 'Total (CZK)': '842 400' },
              { Supplier: 'AWS EMEA SARL',    'Total (CZK)': '614 800' },
            ],
          },
        ],
        createdAt: new Date(),
      },
    ] satisfies AiMessage[],
  },
};

export const Loading: Story = {
  args: {
    ...emptyState,
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        parts: [{ type: 'text', text: 'Show me monthly spend trend' }],
        createdAt: new Date(),
      },
    ] satisfies AiMessage[],
    isLoading: true,
  },
  parameters: {
    docs: {
      description: { story: 'While `isLoading` is true the typing indicator is shown and the input is disabled.' },
    },
  },
};

export const WithError: Story = {
  args: {
    ...emptyState,
    error: 'Backend unavailable. Please try again.',
  },
};

export const AboveInputSlot: Story = {
  args: {
    ...emptyState,
    aboveInput: <p>Was this conversation helpful?</p>,
  },
  parameters: {
    docs: {
      description: {
        story: '`aboveInput` renders consumer content between the message list / error banner and the input. Omit it and no wrapper is rendered.',
      },
    },
  },
};

// Live story — calls useAiChat internally via a render wrapper
export const LiveWithMockAdapter: Story = {
  name: 'Live — mockAdapter',
  parameters: {
    docs: {
      description: {
        story: 'Fully interactive. The render function calls `useAiChat` and wires results into `AiChat`. Try typing "Show me monthly spend trend".',
      },
    },
  },
  render: function Render() {
    const chat = useAiChat({ adapter: mockAdapter });
    return (
      <AiChat
        messages={chat.messages}
        input={chat.input}
        isLoading={chat.isLoading}
        isConnecting={chat.isConnecting}
        error={chat.error}
        onInputChange={chat.setInput}
        onSend={chat.sendMessage}
        onProposalConfirm={chat.confirmProposal}
        onProposalCancel={chat.cancelProposal}
      />
    );
  },
};

export const LiveWithDashboardAdapter: Story = {
  name: 'Live — dashboardAdapter (proactive)',
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the dashboard pattern — the parent sends an `__init__` message on mount so the AI greets the user proactively without any input.',
      },
    },
  },
  render: function Render() {
    const [initiated, setInitiated] = useState(false);
    const chat = useAiChat({ adapter: dashboardAdapter });

    if (!initiated) {
      setInitiated(true);
      chat.setInput('__init__');
      setTimeout(() => chat.sendMessage(), 0);
    }

    return (
      <AiChat
        messages={chat.messages}
        input={chat.input}
        isLoading={chat.isLoading}
        isConnecting={chat.isConnecting}
        error={chat.error}
        onInputChange={chat.setInput}
        onSend={chat.sendMessage}
        onProposalConfirm={chat.confirmProposal}
        onProposalCancel={chat.cancelProposal}
      />
    );
  },
};
