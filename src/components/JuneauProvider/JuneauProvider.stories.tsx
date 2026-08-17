import type { Meta, StoryObj } from '@storybook/react-vite';
import { JuneauProvider } from './JuneauProvider';
import { AiChatProvider } from '../../context/AiChatProvider';
import { AiSidebar } from '../AiSidebar/AiSidebar';
import { AiProposalCard } from '../parts/AiProposalCard';
import { mockAdapter } from '../../adapters/mockAdapter';
import { juneauCs } from '../../i18n/locales/cs';

const meta: Meta<typeof JuneauProvider> = {
  title: 'Foundation/JuneauProvider',
  component: JuneauProvider,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Required wrapper for all Juneau components. Provides two things to its subtree:

1. **Theme** — CSS custom property overrides for colors and radii
2. **Labels** — translated UI strings for every component

**Minimal setup**

\`\`\`tsx
import { JuneauProvider, AiSidebar } from 'juneau';

<JuneauProvider>
  <AiSidebar adapter={myAdapter} />
</JuneauProvider>
\`\`\`

**With Czech locale**

\`\`\`tsx
import { JuneauProvider, AiSidebar, juneauCs } from 'juneau';

<JuneauProvider labels={juneauCs}>
  <AiSidebar adapter={myAdapter} />
</JuneauProvider>
\`\`\`

**With custom theme**

\`\`\`tsx
<JuneauProvider theme={{ colorPrimary: '#0f766e', colorAccent: '#14b8a6' }}>
  <AiSidebar adapter={myAdapter} />
</JuneauProvider>
\`\`\`

Both \`labels\` and \`theme\` are fully optional and can be combined.
Multiple \`JuneauProvider\` instances with different settings can coexist on the same page.
        `.trim(),
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof JuneauProvider>;

const sampleProposal = {
  type: 'proposal' as const,
  proposal: {
    id: 'demo',
    title: 'Save as recurring report',
    description: 'This overview will be auto-generated every quarter.',
    confirmLabel: undefined,
    cancelLabel: undefined,
  },
};

const sampleProposalCs = {
  type: 'proposal' as const,
  proposal: {
    id: 'demo-cs',
    title: 'Uložit jako opakovaný report',
    description: 'Tento přehled bude automaticky generován každý kvartál.',
    confirmLabel: undefined,
    cancelLabel: undefined,
  },
};

// ── Locale stories ─────────────────────────────────────────────────────────────

export const EnglishDefault: Story = {
  name: 'Labels — English (default)',
  parameters: {
    docs: {
      description: {
        story: 'No `labels` prop — all strings fall back to `juneauEn`. This is what every consumer gets out of the box.',
      },
    },
  },
  render: () => (
    <JuneauProvider>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 420 }}>
        <AiProposalCard part={sampleProposal} onConfirm={() => {}} onCancel={() => {}} />
      </div>
    </JuneauProvider>
  ),
};

export const CzechLocale: Story = {
  name: 'Labels — Czech (juneauCs)',
  parameters: {
    docs: {
      description: {
        story:
          'Pass `labels={juneauCs}` to switch all built-in strings to Czech. Individual keys can be overridden — e.g. `labels={{ ...juneauCs, sidebarTitle: "Můj Asistent" }}`.',
      },
    },
  },
  render: () => (
    <JuneauProvider labels={juneauCs}>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 420 }}>
        <AiProposalCard part={sampleProposalCs} onConfirm={() => {}} onCancel={() => {}} />
      </div>
    </JuneauProvider>
  ),
};

export const PartialOverride: Story = {
  name: 'Labels — Partial override',
  parameters: {
    docs: {
      description: {
        story:
          'You can spread a built-in locale and override only specific keys. Missing keys fall back to `juneauEn` — not to the spread locale — so always spread explicitly.',
      },
    },
  },
  render: () => (
    <JuneauProvider labels={{ ...juneauCs, proposalConfirm: 'Ano, uložit', proposalCancel: 'Ne, díky' }}>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 420 }}>
        <AiProposalCard part={sampleProposalCs} onConfirm={() => {}} onCancel={() => {}} />
      </div>
    </JuneauProvider>
  ),
};

// ── Theme stories ──────────────────────────────────────────────────────────────

export const DefaultTheme: Story = {
  name: 'Theme — Default (black + pink)',
  parameters: {
    docs: {
      description: { story: 'The default black + pink theme — no `theme` prop needed.' },
    },
  },
  render: () => (
    <JuneauProvider>
      <div style={{ padding: 24, maxWidth: 420 }}>
        <AiProposalCard part={sampleProposal} onConfirm={() => {}} onCancel={() => {}} />
      </div>
    </JuneauProvider>
  ),
};

export const TealTheme: Story = {
  name: 'Theme — Teal',
  parameters: {
    docs: {
      description: {
        story: 'Override `colorPrimary` and `colorAccent` to switch the entire subtree to teal.',
      },
    },
  },
  render: () => (
    <JuneauProvider theme={{ colorPrimary: '#0f766e', colorPrimaryDark: '#0d9488', colorAccent: '#14b8a6', colorAccentDark: '#0d9488', colorAccentLight: '#f0fdfa', colorAccentBorder: '#99f6e4' }}>
      <div style={{ padding: 24, maxWidth: 420 }}>
        <AiProposalCard part={sampleProposal} onConfirm={() => {}} onCancel={() => {}} />
      </div>
    </JuneauProvider>
  ),
};

export const PurpleTheme: Story = {
  name: 'Theme — Purple',
  parameters: {
    docs: {
      description: { story: 'Classic indigo/violet palette for reference.' },
    },
  },
  render: () => (
    <JuneauProvider theme={{ colorPrimary: '#6366f1', colorPrimaryDark: '#4f46e5', colorPrimaryLight: '#eef2ff', colorPrimaryBorder: '#c7d2fe', colorAccent: '#8b5cf6', colorAccentDark: '#7c3aed', colorAccentLight: '#f5f3ff', colorAccentBorder: '#ddd6fe' }}>
      <div style={{ padding: 24, maxWidth: 420 }}>
        <AiProposalCard part={sampleProposal} onConfirm={() => {}} onCancel={() => {}} />
      </div>
    </JuneauProvider>
  ),
};

// ── Live sidebar stories ───────────────────────────────────────────────────────

export const LiveSidebarCzech: Story = {
  name: 'Live Sidebar — Czech',
  parameters: {
    docs: {
      description: {
        story: 'Full live sidebar with `juneauCs` labels. Type a message to see streaming in action.',
      },
    },
  },
  render: () => (
    <JuneauProvider labels={juneauCs}>
      <AiChatProvider adapter={mockAdapter}>
        <div style={{ display: 'flex', height: '100vh', justifyContent: 'flex-end', backgroundColor: 'var(--juneau-color-surface-raised)' }}>
          <AiSidebar />
        </div>
      </AiChatProvider>
    </JuneauProvider>
  ),
};

export const LiveSidebarTealCzech: Story = {
  name: 'Live Sidebar — Teal + Czech',
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates combining a custom theme with a locale — both are independent and fully composable.',
      },
    },
  },
  render: () => (
    <JuneauProvider
      labels={juneauCs}
      theme={{ colorPrimary: '#0f766e', colorPrimaryDark: '#0d9488', colorAccent: '#14b8a6', colorAccentDark: '#0d9488', colorAccentLight: '#f0fdfa', colorAccentBorder: '#99f6e4' }}
    >
      <AiChatProvider adapter={mockAdapter}>
        <div style={{ display: 'flex', height: '100vh', justifyContent: 'flex-end', backgroundColor: 'var(--juneau-color-surface-raised)' }}>
          <AiSidebar />
        </div>
      </AiChatProvider>
    </JuneauProvider>
  ),
};
