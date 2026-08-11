import type { Meta, StoryObj } from '@storybook/react-vite';
import { AiError } from './AiError';

const meta: Meta<typeof AiError> = {
  title: 'Components/AiError',
  component: AiError,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Error banner displayed when the adapter returns an error or the stream fails.',
      },
    },
  },
  argTypes: {
    onDismiss: { action: 'dismissed' },
  },
};

export default meta;
type Story = StoryObj<typeof AiError>;

export const Default: Story = {
  args: {
    message: 'Something went wrong while processing your request.',
  },
};

export const WithDismiss: Story = {
  args: {
    message: 'Connection timed out. Please try again.',
    onDismiss: () => {},
  },
};

export const LongMessage: Story = {
  args: {
    message: 'The AI backend returned an unexpected response format. This may be a temporary issue — please wait a moment and try sending your message again.',
    onDismiss: () => {},
  },
};
