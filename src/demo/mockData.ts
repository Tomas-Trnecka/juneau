export type KpiCard = {
  label: string;
  value: string;
  change: string;
  positive: boolean;
};

export type RecentInvoice = {
  id: string;
  vendor: string;
  amount: string;
  status: 'paid' | 'pending' | 'overdue';
  date: string;
};

export const kpiCards: KpiCard[] = [
  { label: 'Total Spend (YTD)', value: 'CZK 14,280,000', change: '+8.4%', positive: false },
  { label: 'Open Invoices', value: '37', change: '-12%', positive: true },
  { label: 'Avg. Processing Time', value: '2.3 days', change: '-0.5 days', positive: true },
  { label: 'Active Suppliers', value: '142', change: '+6', positive: true }
];

export const recentInvoices: RecentInvoice[] = [
  { id: 'INV-2024-0891', vendor: 'Microsoft s.r.o.', amount: 'CZK 284,800', status: 'paid', date: '2024-06-18' },
  { id: 'INV-2024-0890', vendor: 'AWS EMEA SARL', amount: 'CZK 102,400', status: 'paid', date: '2024-06-17' },
  { id: 'INV-2024-0889', vendor: 'DataSys a.s.', amount: 'CZK 195,000', status: 'pending', date: '2024-06-15' },
  { id: 'INV-2024-0888', vendor: 'NetFlow s.r.o.', amount: 'CZK 54,625', status: 'overdue', date: '2024-06-01' },
  { id: 'INV-2024-0887', vendor: 'SoftLicence EU', amount: 'CZK 97,200', status: 'paid', date: '2024-05-30' }
];

export const suggestedQuestions = [
  'How much did we spend on IT in Q2 by supplier?',
  'Show me monthly spend trend',
  'What can you help me with?'
];
