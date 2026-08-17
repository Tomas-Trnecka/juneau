import type { Meta, StoryObj } from '@storybook/react-vite';
import { JuneauProvider } from '../JuneauProvider/JuneauProvider';
import { AiChatProvider } from '../../context/AiChatProvider';
import { AiSidebar } from './AiSidebar';
import { mockAdapter } from '../../adapters/mockAdapter';
import { juneauCs } from '../../i18n/locales/cs';
import type { AiBackendAdapter, AiAdapterInput, AiStreamEvent } from '../../core/types';

const withProvider = (adapter: AiBackendAdapter = mockAdapter) =>
  (Story: React.ComponentType) => (
    <AiChatProvider adapter={adapter}>
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'flex-end', backgroundColor: 'var(--juneau-color-surface-raised)' }}>
        <Story />
      </div>
    </AiChatProvider>
  );

const meta: Meta<typeof AiSidebar> = {
  title: 'Components/AiSidebar',
  component: AiSidebar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Top-level chat sidebar. Reads shared chat state from the nearest \`AiChatProvider\` —
wrap your app once at the root and mount \`<AiSidebar />\` anywhere.

\`\`\`tsx
<AiChatProvider adapter={myAdapter}>
  <App />          {/* sidebar can live in any nested layout */}
  <AiSidebar />
</AiChatProvider>
\`\`\`

Use \`setContext()\` from \`useAiChatContext()\` on each page to tell the AI where the user is.
        `.trim(),
      },
    },
  },
  decorators: [withProvider()],
};

export default meta;
type Story = StoryObj<typeof AiSidebar>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default English labels from `juneauEn`. Type a message — try "Show me data" or "What can you help me with?"',
      },
    },
  },
};

export const Czech: Story = {
  decorators: [
    (Story) => (
      <JuneauProvider labels={juneauCs}>
        <AiChatProvider adapter={mockAdapter}>
          <div style={{ display: 'flex', height: '100vh', justifyContent: 'flex-end', backgroundColor: 'var(--juneau-color-surface-raised)' }}>
            <Story />
          </div>
        </AiChatProvider>
      </JuneauProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Same sidebar with `juneauCs` labels applied via a wrapping `JuneauProvider`.',
      },
    },
  },
};

export const CustomTitle: Story = {
  args: {
    title: 'Analytics Copilot',
  },
  parameters: {
    docs: {
      description: {
        story: 'The `title` prop overrides only the header label for this instance.',
      },
    },
  },
};

export const WithApplicationContext: Story = {
  name: 'With Application Context',
  decorators: [
    (Story) => (
      <AiChatProvider
        adapter={mockAdapter}
        context={{ department: 'IT', fiscalYear: 2024, currency: 'CZK' }}
      >
        <div style={{ display: 'flex', height: '100vh', justifyContent: 'flex-end', backgroundColor: 'var(--juneau-color-surface-raised)' }}>
          <Story />
        </div>
      </AiChatProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'The `context` prop on `AiChatProvider` is forwarded opaquely to every adapter call. Use it to pass current page, entity ID, user role — anything the backend might need.',
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
  decorators: [withProvider(errorAdapter)],
  parameters: {
    docs: {
      description: {
        story: 'When the adapter yields an `error` event the error banner appears above the input.',
      },
    },
  },
};
