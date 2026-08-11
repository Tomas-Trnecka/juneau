import type { Meta, StoryObj } from '@storybook/react-vite';
import { AiProposalCard } from './AiProposalCard';

const meta: Meta<typeof AiProposalCard> = {
  title: 'Components/Parts/AiProposalCard',
  component: AiProposalCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'A proposal card the AI can present to the user for confirmation or cancellation. Payload is opaque — the consumer decides how to handle it.',
      },
    },
  },
  argTypes: {
    onConfirm: { action: 'confirmed' },
    onCancel: { action: 'cancelled' },
  },
};

export default meta;
type Story = StoryObj<typeof AiProposalCard>;

export const SaveReport: Story = {
  args: {
    part: {
      type: 'proposal',
      proposal: {
        id: 'save-it-q2-report',
        title: 'Save as recurring report',
        description: 'This IT spend overview by supplier will be auto-generated every quarter.',
        confirmLabel: 'Save report',
        cancelLabel: 'Dismiss',
        payload: { reportType: 'spend-by-supplier', period: 'Q2', category: 'IT' },
      },
    },
    onConfirm: () => {},
    onCancel: () => {},
  },
};

export const MinimalNoDescription: Story = {
  args: {
    part: {
      type: 'proposal',
      proposal: {
        id: 'export-csv',
        title: 'Export data as CSV',
      },
    },
    onConfirm: () => {},
    onCancel: () => {},
  },
};

export const DefaultLabels: Story = {
  args: {
    part: {
      type: 'proposal',
      proposal: {
        id: 'schedule-email',
        title: 'Schedule weekly email digest',
        description: 'Receive a summary of key financial metrics every Monday at 8:00 AM.',
        payload: { schedule: 'weekly', day: 'monday', time: '08:00' },
      },
    },
    onConfirm: () => {},
    onCancel: () => {},
  },
};
