import type { Meta, StoryObj } from '@storybook/react-vite';
import { AiMessageBubble } from './AiMessageBubble';

const meta: Meta<typeof AiMessageBubble> = {
  title: 'Components/AiMessageBubble',
  component: AiMessageBubble,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Single message row. Aligns user messages to the right, assistant messages to the left. Delegates rendering of each part to `AiMessagePartRenderer`.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{
        width: 380,
        padding: '8px 12px',
        background: 'var(--juneau-color-surface)',
        border: '1px solid var(--juneau-color-border)',
        borderRadius: 'var(--juneau-radius-lg)',
      }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    onProposalConfirm: { action: 'proposal confirmed' },
    onProposalCancel: { action: 'proposal cancelled' },
  },
};

export default meta;
type Story = StoryObj<typeof AiMessageBubble>;

export const UserMessage: Story = {
  args: {
    message: {
      id: 'msg-1',
      role: 'user',
      parts: [{ type: 'text', text: 'How much did we spend on IT in Q2 by supplier?' }],
      createdAt: new Date(),
    },
    onProposalConfirm: () => {},
    onProposalCancel: () => {},
  },
};

export const AssistantText: Story = {
  args: {
    message: {
      id: 'msg-2',
      role: 'assistant',
      parts: [{ type: 'text', text: 'Preparing the IT spend overview for Q2… Loading data from the system.' }],
      createdAt: new Date(),
    },
    onProposalConfirm: () => {},
    onProposalCancel: () => {},
  },
};

export const AssistantWithTable: Story = {
  args: {
    message: {
      id: 'msg-3',
      role: 'assistant',
      parts: [
        { type: 'text', text: 'Here is the IT spend breakdown by supplier for Q2:' },
        {
          type: 'table',
          columns: ['Supplier', 'Category', 'Total (CZK)', 'Invoices'],
          rows: [
            { Supplier: 'Microsoft s.r.o.', Category: 'Software', 'Total (CZK)': '842 400', Invoices: '3' },
            { Supplier: 'AWS EMEA SARL', Category: 'Cloud', 'Total (CZK)': '614 800', Invoices: '6' },
            { Supplier: 'DataSys a.s.', Category: 'Consulting', 'Total (CZK)': '390 000', Invoices: '2' },
          ],
        },
      ],
      createdAt: new Date(),
    },
    onProposalConfirm: () => {},
    onProposalCancel: () => {},
  },
};

export const AssistantWithProposal: Story = {
  args: {
    message: {
      id: 'msg-4',
      role: 'assistant',
      parts: [
        { type: 'text', text: 'Total IT spend in Q2 reached CZK 2 162 900 — up 12% vs Q1.' },
        {
          type: 'proposal',
          proposal: {
            id: 'save-it-q2-report',
            title: 'Save as recurring report',
            description: 'This IT spend overview by supplier will be auto-generated every quarter.',
            confirmLabel: 'Save report',
            cancelLabel: 'Dismiss',
            payload: { reportType: 'spend-by-supplier', period: 'Q2' },
          },
        },
      ],
      createdAt: new Date(),
    },
    onProposalConfirm: () => {},
    onProposalCancel: () => {},
  },
};

export const AssistantWithCardAndFollowUp: Story = {
  args: {
    message: {
      id: 'msg-6',
      role: 'assistant',
      parts: [
        { type: 'text', text: 'I found the top supplier for Q2:' },
        {
          type: 'entity',
          entity: {
            id: 'sup-1',
            title: 'Microsoft s.r.o.',
            subtitle: 'Software · 3 invoices',
            fields: [
              { label: 'Total', value: '842 400 CZK' },
              { label: 'Last invoice', value: '28. 6. 2025' },
            ],
          },
        },
        { type: 'text', text: 'Want me to break this down by month?' },
      ],
      createdAt: new Date(),
    },
    onProposalConfirm: () => {},
    onProposalCancel: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'Cards span the full width with no bubble chrome, while the surrounding text keeps its own bubbles. Avatar placement is unchanged.',
      },
    },
  },
};

export const AssistantError: Story = {
  args: {
    message: {
      id: 'msg-5',
      role: 'assistant',
      parts: [{ type: 'error', message: 'Failed to load data. Please try again.' }],
      createdAt: new Date(),
    },
    onProposalConfirm: () => {},
    onProposalCancel: () => {},
  },
  parameters: {
    docs: {
      description: { story: 'Error parts are rendered inline inside the bubble — distinct from the top-level `AiError` banner.' },
    },
  },
};
