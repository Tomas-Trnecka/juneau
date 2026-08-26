import type { Meta, StoryObj } from '@storybook/react-vite';
import { AiEntityListPart } from './AiEntityListPart';

const meta: Meta<typeof AiEntityListPart> = {
  title: 'Components/Parts/AiEntityListPart',
  component: AiEntityListPart,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Renders a list of structured entities as stacked cards with an optional heading.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AiEntityListPart>;

export const SearchResults: Story = {
  args: {
    part: {
      type: 'entity-list',
      title: '3 records found',
      entityType: 'record',
      entities: [
        {
          id: 'rec-1',
          title: 'REC-2024-0894',
          subtitle: 'Northwind Trading Ltd.',
          fields: [
            { label: 'Amount', value: 'CZK 128 400' },
            { label: 'Status', value: 'Approved', badge: 'success' },
          ],
        },
        {
          id: 'rec-2',
          title: 'REC-2024-0895',
          subtitle: 'Contoso s.r.o.',
          fields: [
            { label: 'Amount', value: 'CZK 42 000' },
            { label: 'Status', value: 'Pending', badge: 'warning' },
          ],
        },
        {
          id: 'rec-3',
          title: 'REC-2024-0896',
          subtitle: 'Fabrikam a.s.',
          fields: [
            { label: 'Amount', value: 'CZK 315 900' },
            { label: 'Status', value: 'Rejected', badge: 'danger' },
          ],
        },
      ],
    },
  },
};

export const ClickableList: Story = {
  args: {
    ...SearchResults.args,
    onEntityClick: (entity) => alert(`Open ${entity.id}`),
  },
};

export const WithoutTitle: Story = {
  args: {
    part: {
      type: 'entity-list',
      entities: [
        { title: 'Item one', subtitle: 'First result' },
        { title: 'Item two', subtitle: 'Second result' },
      ],
    },
  },
};
