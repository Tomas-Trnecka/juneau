import type { Meta, StoryObj } from '@storybook/react-vite';
import { AiChatHistoryList } from './AiChatHistoryList';

const sampleChats = [
  {
    id: 'chat-1',
    title: 'Quarterly report questions',
    createdAt: new Date('2025-01-10T09:00:00Z'),
    updatedAt: new Date('2025-01-12T14:30:00Z'),
  },
  {
    id: 'chat-2',
    title: 'Data export help',
    createdAt: new Date('2025-01-08T11:00:00Z'),
    updatedAt: new Date('2025-01-09T16:45:00Z'),
  },
  {
    id: 'chat-3',
    title: 'A very long chat title that should truncate with an ellipsis instead of wrapping',
    createdAt: new Date('2025-01-05T08:00:00Z'),
    updatedAt: new Date('2025-01-05T08:20:00Z'),
  },
];

const meta: Meta<typeof AiChatHistoryList> = {
  title: 'Components/AiChatHistoryList',
  component: AiChatHistoryList,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Renders a list of stored chats (`AiChatSummary[]`). Juneau is storage-agnostic — the consumer loads summaries from their own storage and handles selection/deletion.',
      },
    },
  },
  argTypes: {
    onSelect: { action: 'selected' },
    onDelete: { action: 'deleted' },
  },
  decorators: [
    Story => (
      <div style={{ width: 280, border: '1px solid #E8E8EC', borderRadius: 12 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AiChatHistoryList>;

export const Default: Story = {
  args: {
    chats: sampleChats,
    onSelect: () => {},
  },
};

export const WithActiveChat: Story = {
  args: {
    chats: sampleChats,
    activeChatId: 'chat-2',
    onSelect: () => {},
  },
};

export const WithDelete: Story = {
  args: {
    chats: sampleChats,
    onSelect: () => {},
    onDelete: () => {},
  },
};

export const Empty: Story = {
  args: {
    chats: [],
    onSelect: () => {},
  },
};
