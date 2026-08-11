import type { Meta, StoryObj } from '@storybook/react-vite';
import { AiTablePart } from './AiTablePart';

const meta: Meta<typeof AiTablePart> = {
  title: 'Components/Parts/AiTablePart',
  component: AiTablePart,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Renders a structured table message part — columns + rows from the AI response.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AiTablePart>;

export const SpendBySupplier: Story = {
  args: {
    part: {
      type: 'table',
      columns: ['Supplier', 'Category', 'Total (CZK)', 'Invoices'],
      rows: [
        { Supplier: 'Microsoft s.r.o.', Category: 'Software', 'Total (CZK)': '842 400', Invoices: '3' },
        { Supplier: 'AWS EMEA SARL', Category: 'Cloud', 'Total (CZK)': '614 800', Invoices: '6' },
        { Supplier: 'DataSys a.s.', Category: 'Consulting', 'Total (CZK)': '390 000', Invoices: '2' },
        { Supplier: 'NetFlow s.r.o.', Category: 'Infrastructure', 'Total (CZK)': '218 500', Invoices: '4' },
      ],
    },
  },
};

export const MonthlyTrend: Story = {
  args: {
    part: {
      type: 'table',
      columns: ['Month', 'Spend (CZK)', 'Change'],
      rows: [
        { Month: 'January', 'Spend (CZK)': '1 240 000', Change: '—' },
        { Month: 'February', 'Spend (CZK)': '980 000', Change: '-21 %' },
        { Month: 'March', 'Spend (CZK)': '1 560 000', Change: '+59 %' },
        { Month: 'April', 'Spend (CZK)': '1 120 000', Change: '-28 %' },
        { Month: 'May', 'Spend (CZK)': '1 380 000', Change: '+23 %' },
        { Month: 'June', 'Spend (CZK)': '1 650 000', Change: '+20 %' },
      ],
    },
  },
};

export const SingleRow: Story = {
  args: {
    part: {
      type: 'table',
      columns: ['Metric', 'Value'],
      rows: [{ Metric: 'Total IT Spend Q2', Value: 'CZK 2 162 900' }],
    },
  },
};
