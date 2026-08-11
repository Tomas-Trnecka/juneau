import type { Meta, StoryObj } from '@storybook/react-vite';
import { AiTypingIndicator } from './AiTypingIndicator';

const meta: Meta<typeof AiTypingIndicator> = {
  title: 'Components/AiTypingIndicator',
  component: AiTypingIndicator,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Three-dot animated indicator shown below the message list while the assistant is streaming a response. Rendered by `AiMessageList` automatically when `isLoading` is true.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{
        background: 'var(--juneau-color-surface)',
        border: '1px solid var(--juneau-color-border)',
        borderRadius: 'var(--juneau-radius-lg)',
        padding: '12px',
        maxWidth: 120,
      }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AiTypingIndicator>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Dots animate in a staggered bounce loop. No props — this component has no configuration.',
      },
    },
  },
};
