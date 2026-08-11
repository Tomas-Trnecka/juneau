import type { Meta, StoryObj } from '@storybook/react-vite';
import { AiMessageList } from './AiMessageList';
import type { AiMessage } from '../../core/types';

const meta: Meta<typeof AiMessageList> = {
  title: 'Components/AiMessageList',
  component: AiMessageList,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Scrollable message area. Renders the empty state when there are no messages, a typing indicator while `isLoading` is true, and auto-scrolls to the bottom on each update.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{
        height: 480,
        width: 380,
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
  argTypes: {
    onProposalConfirm: { action: 'proposal confirmed' },
    onProposalCancel: { action: 'proposal cancelled' },
  },
};

export default meta;
type Story = StoryObj<typeof AiMessageList>;

const conversation: AiMessage[] = [
  {
    id: 'msg-1',
    role: 'user',
    parts: [{ type: 'text', text: 'How much did we spend on IT in Q2 by supplier?' }],
    createdAt: new Date(),
  },
  {
    id: 'msg-2',
    role: 'assistant',
    parts: [
      { type: 'text', text: 'Preparing the IT spend overview for Q2…\n\n' },
      {
        type: 'table',
        columns: ['Supplier', 'Category', 'Total (CZK)'],
        rows: [
          { Supplier: 'Microsoft s.r.o.', Category: 'Software', 'Total (CZK)': '842 400' },
          { Supplier: 'AWS EMEA SARL', Category: 'Cloud', 'Total (CZK)': '614 800' },
          { Supplier: 'DataSys a.s.', Category: 'Consulting', 'Total (CZK)': '390 000' },
        ],
      },
      { type: 'text', text: '\n\nTotal Q2 IT spend: CZK 2 162 900 — up 12% vs Q1.' },
    ],
    createdAt: new Date(),
  },
];

export const Empty: Story = {
  args: {
    messages: [],
    isLoading: false,
    onProposalConfirm: () => {},
    onProposalCancel: () => {},
  },
  parameters: {
    docs: {
      description: { story: 'Initial state before the user sends any message.' },
    },
  },
};

export const WithMessages: Story = {
  args: {
    messages: conversation,
    isLoading: false,
    onProposalConfirm: () => {},
    onProposalCancel: () => {},
  },
};

export const Typing: Story = {
  args: {
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        parts: [{ type: 'text', text: 'Show me the monthly spend trend' }],
        createdAt: new Date(),
      },
    ],
    isLoading: true,
    onProposalConfirm: () => {},
    onProposalCancel: () => {},
  },
  parameters: {
    docs: {
      description: { story: '`isLoading: true` shows the typing indicator below the last message.' },
    },
  },
};

export const WithProposal: Story = {
  args: {
    messages: [
      ...conversation,
      {
        id: 'msg-3',
        role: 'assistant',
        parts: [
          {
            type: 'proposal',
            proposal: {
              id: 'save-it-q2-report',
              title: 'Save as recurring report',
              description: 'This IT spend overview will be auto-generated every quarter.',
              confirmLabel: 'Save report',
              cancelLabel: 'Dismiss',
            },
          },
        ],
        createdAt: new Date(),
      },
    ],
    isLoading: false,
    onProposalConfirm: () => {},
    onProposalCancel: () => {},
  },
  parameters: {
    docs: {
      description: { story: 'Proposal cards appear inline as a message part. Confirm/cancel actions are surfaced to the Actions panel.' },
    },
  },
};
