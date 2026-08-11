import type { Meta, StoryObj } from '@storybook/react-vite';
import { JuneauProvider } from '../JuneauProvider/JuneauProvider';
import { AiSidebar } from './AiSidebar';
import { mockAdapter } from '../../adapters/mockAdapter';
import { juneauCs } from '../../i18n/locales/cs';
import type { AiBackendAdapter, AiAdapterInput, AiStreamEvent } from '../../core/types';

const meta: Meta<typeof AiSidebar> = {
  title: 'Components/AiSidebar',
  component: AiSidebar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Top-level chat sidebar. Owns all chat state internally via \`useAiChat\` —
pass an \`AiBackendAdapter\` and mount it, that's it.

UI strings come from the nearest \`JuneauProvider\`. The optional \`title\` prop
overrides only the header title for this specific instance; for app-wide
language switching use \`labels\` on \`JuneauProvider\` instead.

\`\`\`tsx
<JuneauProvider labels={juneauCs}>
  <AiSidebar adapter={myAdapter} />
</JuneauProvider>
\`\`\`
        `.trim(),
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'flex-end', backgroundColor: 'var(--juneau-color-surface-raised)' }}>
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
type Story = StoryObj<typeof AiSidebar>;

export const Default: Story = {
  args: {
    adapter: mockAdapter,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default English labels from `juneauEn`. Type a message — try "Show me monthly spend trend" or "What can you help me with?"',
      },
    },
  },
};

export const Czech: Story = {
  decorators: [
    (Story) => (
      <JuneauProvider labels={juneauCs}>
        <div style={{ display: 'flex', height: '100vh', justifyContent: 'flex-end', backgroundColor: 'var(--juneau-color-surface-raised)' }}>
          <Story />
        </div>
      </JuneauProvider>
    ),
  ],
  args: {
    adapter: mockAdapter,
  },
  parameters: {
    docs: {
      description: {
        story: 'Same sidebar with `juneauCs` labels applied via a wrapping `JuneauProvider`. No props change on `AiSidebar` itself.',
      },
    },
  },
};

export const CustomTitle: Story = {
  args: {
    adapter: mockAdapter,
    title: 'Analytics Copilot',
  },
  parameters: {
    docs: {
      description: {
        story: 'The `title` prop overrides only the header label for this instance, without affecting other labels.',
      },
    },
  },
};

export const WithApplicationContext: Story = {
  name: 'With Application Context',
  args: {
    adapter: mockAdapter,
    context: { department: 'IT', fiscalYear: 2024, currency: 'CZK' },
  },
  parameters: {
    docs: {
      description: {
        story: 'The `context` prop is forwarded opaquely to every adapter call. Use it to pass the current page, entity ID, user role — anything the backend might need to tailor its response.',
      },
    },
  },
};

const errorAdapter: AiBackendAdapter = {
  async *sendMessage(_input: AiAdapterInput): AsyncIterable<AiStreamEvent> {
    yield { type: 'error', message: 'Backend unavailable. Please try again later.' };
  },
};

export const ErrorState: Story = {
  args: {
    adapter: errorAdapter,
  },
  parameters: {
    docs: {
      description: {
        story: 'When the adapter yields an `error` event the error banner appears above the input. The conversation is not cleared — the user can retry.',
      },
    },
  },
};
