import type { Meta, StoryObj } from '@storybook/react-vite';
import { AiEntityCard } from './AiEntityCard';

const meta: Meta<typeof AiEntityCard> = {
  title: 'Components/Parts/AiEntityCard',
  component: AiEntityCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Renders a structured entity message part — a titled card with labelled fields and optional badges. Becomes clickable when `onEntityClick` is provided.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AiEntityCard>;

export const FullCard: Story = {
  args: {
    part: {
      type: 'entity',
      entityType: 'record',
      entity: {
        id: 'rec-2024-0894',
        title: 'REC-2024-0894',
        subtitle: 'Northwind Trading Ltd.',
        fields: [
          { label: 'Amount', value: 'CZK 128 400' },
          { label: 'Due date', value: '2024-08-15' },
          { label: 'Status', value: 'Approved', badge: 'success' },
        ],
      },
    },
  },
};

export const Clickable: Story = {
  args: {
    ...FullCard.args,
    onEntityClick: (entity, entityType) =>
      alert(`Clicked ${entityType ?? 'entity'} ${entity.id ?? entity.title}`),
  },
};

export const BadgeTones: Story = {
  args: {
    part: {
      type: 'entity',
      entity: {
        title: 'Badge tones',
        fields: [
          { label: 'Success', value: 'Approved', badge: 'success' },
          { label: 'Warning', value: 'Pending', badge: 'warning' },
          { label: 'Danger', value: 'Rejected', badge: 'danger' },
          { label: 'Neutral', value: 'Draft', badge: 'neutral' },
        ],
      },
    },
  },
};

export const TitleOnly: Story = {
  args: {
    part: {
      type: 'entity',
      entity: { title: 'Quarterly report Q2', subtitle: 'Generated 2024-07-01' },
    },
  },
};
