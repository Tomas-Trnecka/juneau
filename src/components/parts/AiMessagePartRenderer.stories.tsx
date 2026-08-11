import type { Meta, StoryObj } from '@storybook/react-vite';
import { AiMessagePartRenderer } from './AiMessagePartRenderer';

const meta: Meta<typeof AiMessagePartRenderer> = {
  title: 'Components/Parts/AiMessagePartRenderer',
  component: AiMessagePartRenderer,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Dispatches each \`AiMessagePart\` to its dedicated renderer.
This is the extension point for custom part types — swap in your own renderer here.

| Part type | Rendered by |
|---|---|
| \`text\` | Inline \`<span>\` with \`white-space: pre-wrap\` |
| \`table\` | \`AiTablePart\` |
| \`proposal\` | \`AiProposalCard\` |
| \`error\` | Inline error span |
        `.trim(),
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{
        width: 380,
        padding: '12px 14px',
        background: 'var(--juneau-color-surface)',
        border: '1px solid var(--juneau-color-border)',
        borderRadius: 'var(--juneau-radius-lg)',
        fontSize: 'var(--juneau-font-size-md)',
      }}>
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
type Story = StoryObj<typeof AiMessagePartRenderer>;

export const Text: Story = {
  args: {
    part: { type: 'text', text: 'Total IT spend in Q2 reached CZK 2 162 900 — up 12% vs Q1.' },
    onProposalConfirm: () => {},
    onProposalCancel: () => {},
  },
};

export const Table: Story = {
  args: {
    part: {
      type: 'table',
      columns: ['Supplier', 'Total (CZK)'],
      rows: [
        { Supplier: 'Microsoft s.r.o.', 'Total (CZK)': '842 400' },
        { Supplier: 'AWS EMEA SARL', 'Total (CZK)': '614 800' },
      ],
    },
    onProposalConfirm: () => {},
    onProposalCancel: () => {},
  },
};

export const Proposal: Story = {
  args: {
    part: {
      type: 'proposal',
      proposal: {
        id: 'save-report',
        title: 'Save as recurring report',
        description: 'Auto-generate this report every quarter.',
        confirmLabel: 'Save',
        cancelLabel: 'Dismiss',
      },
    },
    onProposalConfirm: () => {},
    onProposalCancel: () => {},
  },
};

export const Error: Story = {
  args: {
    part: { type: 'error', message: 'Failed to load data from the backend.' },
    onProposalConfirm: () => {},
    onProposalCancel: () => {},
  },
};
