import { FeatureItem } from '../types';

export const CORE_FEATURES: FeatureItem[] = [
  {
    id: 'qr-dining',
    title: 'Frictionless Table QR Ordering',
    tagline: 'No app download needed. Instant guest ordering.',
    description:
      'Turn table turnovers into high-speed revenue. Guests scan a custom QR code at their table, view your rich photo menu with allergen tags, customize dishes, and order in under 20 seconds.',
    iconName: 'QrCode',
    bulletPoints: [
      'Zero-app required — opens in standard mobile browsers instantly',
      'Dynamic per-table QR codes with real-time dining state',
      'Smart item modifiers, portion sizes, and spice level selections',
      'Live order tracking with prep-time countdowns and kitchen status',
    ],
    metrics: {
      value: '3.4x',
      label: 'Faster order turnaround',
    },
    mockupType: 'qr',
  },
  {
    id: 'kds-kitchen',
    title: 'Real-Time Kitchen Display System (KDS)',
    tagline: 'Direct-to-chef synchronization with acoustic chimes.',
    description:
      'Eliminate lost kitchen tickets and communication errors. Table orders beam instantly to kitchen stations with color-coded priority stages, dietary callouts, and audio notifications.',
    iconName: 'ChefHat',
    bulletPoints: [
      'Instant Socket.IO kitchen broadcast without page polling',
      'Status stages: Placed, Accepted, Cooking, Served, Completed',
      'Synthesized chime alerts with granular volume configuration',
      'Split-ticket routing between hot kitchen, pantry, and bar',
    ],
    metrics: {
      value: '-42%',
      label: 'Kitchen order mistakes',
    },
    mockupType: 'kds',
  },
  {
    id: 'unified-payments',
    title: 'Unified Razorpay & Cash Settlements',
    tagline: 'Support UPI, credit cards, and cash on counter seamlessly.',
    description:
      'Give diners the freedom to pay right from their phone or settle in cash at the counter. Full automated reconciliation, GST invoices, and instant digital PDF receipts.',
    iconName: 'CreditCard',
    bulletPoints: [
      'Native Razorpay checkout: UPI, Google Pay, PhonePe, Paytm & Cards',
      'Split payment support (online prepay or cash on counter)',
      'Immutable PDF receipt generation with verifiable timestamps',
      'Automated bank account payout verification for verified merchants',
    ],
    metrics: {
      value: '+22%',
      label: 'Average check size via upselling',
    },
    mockupType: 'receipt',
  },
  {
    id: 'table-operations',
    title: 'Visual Floor & Table Management',
    tagline: 'Live occupancy maps, table locking, and bill merging.',
    description:
      'Visualize your dining room at a glance. Track occupied tables, vacant booths, pending bills, and active order counts in real time with intuitive color indicators.',
    iconName: 'LayoutGrid',
    bulletPoints: [
      'Interactive restaurant floor map with capacity tracking',
      'One-click table status toggle (Available, Occupied, Reserved, Cleaning)',
      'Automated table locking upon bill settlement',
      'High-resolution printable PDF QR placards with custom branding',
    ],
    metrics: {
      value: '18 min',
      label: 'Saved per table session',
    },
    mockupType: 'tables',
  },
  {
    id: 'analytics-growth',
    title: 'Deep Restaurant Intelligence & Analytics',
    tagline: 'Data-driven insights to maximize margins and repeat diners.',
    description:
      'Know your best-selling dishes, peak rush hours, average order values, and repeat guest percentages. Craviti transforms raw transactions into actionable growth opportunities.',
    iconName: 'TrendingUp',
    bulletPoints: [
      'Real-time revenue, gross margins, and item profit curves',
      'Hourly traffic heatmaps for precise staff shift scheduling',
      'Repeat guest identification and dining behavior analytics',
      '1-click export to CSV & Excel for accounting and tax audits',
    ],
    metrics: {
      value: '+28%',
      label: 'Gross margin improvement',
    },
    mockupType: 'analytics',
  },
  {
    id: 'admin-oversight',
    title: 'Platform Control & Multi-Branch Admin',
    tagline: 'Enterprise oversight for single cafes or 50+ restaurant chains.',
    description:
      'Manage multiple locations from a central pane. Configure global feature flags, verify bank accounts, monitor live platform volumes, and manage role-based staff permissions.',
    iconName: 'ShieldCheck',
    bulletPoints: [
      'Strict multi-tenant isolation with encrypted credential vaults',
      'Four-eye bank verification approval workflow',
      'Granular RBAC: Super Admin, General Manager, Waiter, Cashier',
      'Comprehensive audit logs tracking every status modification',
    ],
    metrics: {
      value: '99.99%',
      label: 'Platform availability SLA',
    },
    mockupType: 'dashboard',
  },
];

