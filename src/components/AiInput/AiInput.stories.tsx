import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { AiInput } from './AiInput';

const meta: Meta<typeof AiInput> = {
  title: 'Components/AiInput',
  component: AiInput,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Textarea + send button at the bottom of the sidebar. Pressing Enter (without Shift) triggers `onSend`. Shift+Enter inserts a newline.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 480, border: '1px solid var(--juneau-color-border)', borderRadius: 'var(--juneau-radius-lg)', overflow: 'hidden' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    onSend: { action: 'sent' },
  },
};

export default meta;
type Story = StoryObj<typeof AiInput>;

export const Empty: Story = {
  args: {
    value: '',
    onChange: () => {},
    onSend: () => {},
    isLoading: false,
  },
};

export const WithText: Story = {
  args: {
    value: 'How much did we spend on IT in Q2 by supplier?',
    onChange: () => {},
    onSend: () => {},
    isLoading: false,
  },
};

export const Loading: Story = {
  args: {
    value: '',
    onChange: () => {},
    onSend: () => {},
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'While `isLoading` is true the textarea and send button are both disabled and the button shows a spinner.',
      },
    },
  },
};

export const CustomPlaceholder: Story = {
  args: {
    value: '',
    onChange: () => {},
    onSend: () => {},
    isLoading: false,
    placeholder: 'Ask about your reports, budgets, suppliers…',
  },
};

export const Interactive: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Fully interactive — type a message and hit Send or Enter. Sent value is logged to the Actions panel.',
      },
    },
  },
  render: function Render() {
    const [value, setValue] = useState('');
    return (
      <AiInput
        value={value}
        onChange={setValue}
        onSend={() => {
          console.log('Sent:', value);
          setValue('');
        }}
        isLoading={false}
      />
    );
  },
};
