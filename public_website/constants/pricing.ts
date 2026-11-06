import { PricingPlan } from '../types';

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'standard',
    name: 'Craviti Standard',
    tagline: 'Everything your restaurant needs to accept QR orders, manage tables, receive payments, and grow digitally.',
    priceDisplay: '₹699',
    pricePeriod: '/ month',
    originalPrice: '₹1,500/month',
    isLaunchOffer: true,
    launchOfferLabel: 'Launch Offer',
    variant: 'standard',
    features: [
      'Unlimited QR Ordering',
      'Unlimited Tables',
      'Unlimited Menu Items',
      'Kitchen Dashboard',
      'Waiter Panel',
      'Customer Order Tracking',
      'Razorpay Payments',
      'Cash Payments',
      'GST & Tax Configuration',
      'Discounts',
      'Digital Receipts',
      'Analytics',
      'Staff Management',
      'Notifications',
      'Secure Cloud Hosting',
      'Free Updates',
      'Priority WhatsApp Support',
    ],
    ctaText: 'Start Free 14-Day Trial',
    ctaHref: '/join',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Designed for restaurant chains and businesses that require custom workflows, integrations, and dedicated support.',
    priceDisplay: 'Custom Pricing',
    pricePeriod: 'Tailored to your scale',
    variant: 'enterprise',
    features: ['Everything in Standard'],
    enterprisePlus: [
      'Multi Branch Management',
      'Franchise Support',
      'White Label Branding',
      'Custom Domain',
      'POS Integration',
      'ERP Integration',
      'API Access',
      'Dedicated Account Manager',
      'Staff Training',
      'Data Migration',
      'SLA Support',
      'Dedicated Infrastructure',
      'Custom Feature Development',
      'Any custom functionality required by your business',
    ],
    ctaText: 'Contact Craviti Sales',
    ctaHref: '/contact',
  },
];

export interface ComparisonRow {
  category: string;
  feature: string;
  standard: string;
  enterprise: string;
}

export const COMPARISON_CATEGORIES = [
  {
    name: 'Ordering & Guest Experience',
    rows: [
      { feature: 'QR Code Ordering', standard: 'Unlimited', enterprise: 'Unlimited + White Label' },
      { feature: 'Tables & Dining Areas', standard: 'Unlimited', enterprise: 'Multi-Floor & Multi-Branch' },
      { feature: 'Menu Items & Modifiers', standard: 'Unlimited', enterprise: 'Unlimited + Central Chain Sync' },
      { feature: 'Customer Order Tracking', standard: 'Real-Time Browser Tracking', enterprise: 'Custom Branded Live Tracking' },
      { feature: 'Discounts & Promo Codes', standard: 'Included', enterprise: 'Dynamic Chain-Wide Promos' },
    ],
  },
  {
    name: 'Kitchen & Floor Operations',
    rows: [
      { feature: 'Kitchen Dashboard (KDS)', standard: 'Included (Live Screen)', enterprise: 'Multi-Station Routing (Hot, Cold, Bar)' },
      { feature: 'Waiter Panel & Floor Calling', standard: 'Included', enterprise: 'Included' },
      { feature: 'Sound Chimes & Notifications', standard: 'Included (Volume Control)', enterprise: 'Multi-Zone Acoustic Chimes' },
      { feature: 'Staff Management & Roles', standard: 'Standard Staff Roles', enterprise: 'Granular Multi-Outlet RBAC' },
    ],
  },
  {
    name: 'Payments, Taxes & Billing',
    rows: [
      { feature: 'Razorpay Online Payments', standard: 'UPI, Cards, NetBanking', enterprise: 'Custom Settlement Rails' },
      { feature: 'Cash Billing & Verification', standard: 'Included', enterprise: 'Included' },
      { feature: 'GST & Tax Configuration', standard: 'Automated 5% / 18% GST', enterprise: 'Multi-State & Franchise Tax Rules' },
      { feature: 'Digital PDF Receipts', standard: 'Deterministic Snapshots', enterprise: 'Custom Branded Tax Invoices' },
      { feature: 'Analytics & Sales Reporting', standard: 'Daily & Monthly Analytics', enterprise: 'Multi-Branch Executive BI' },
    ],
  },
  {
    name: 'Enterprise, Integrations & Custom Development',
    rows: [
      { feature: 'Multi-Branch & Franchise Support', standard: '—', enterprise: 'Included (Centralized Control)' },
      { feature: 'White Label Branding & Custom Domain', standard: '—', enterprise: 'Included (Your Domain & Brand)' },
      { feature: 'POS Integration', standard: '—', enterprise: 'Included (Custom POS Connectors)' },
      { feature: 'ERP Integration (SAP, Tally, Zoho)', standard: '—', enterprise: 'Included (Two-Way Automated Sync)' },
      { feature: 'REST API & Webhooks Access', standard: '—', enterprise: 'Full Developer API & Webhooks' },
      { feature: 'Dedicated Account Manager', standard: '—', enterprise: 'Included (Direct WhatsApp / Phone)' },
      { feature: 'Staff Training & Onboarding', standard: 'Video Guides & Docs', enterprise: 'Live Remote & On-Site Training' },
      { feature: 'Historical Data Migration', standard: 'Self-Serve Import', enterprise: 'Dedicated White-Glove Concierge' },
      { feature: 'SLA Support & Uptime', standard: '99.9% Uptime Target', enterprise: '99.99% Financially Backed SLA' },
      { feature: 'Dedicated Infrastructure', standard: 'Multi-Tenant Cloud', enterprise: 'Isolated Private Infrastructure' },
      { feature: 'Custom Feature Development', standard: '—', enterprise: 'Included (Tailored Workflows)' },
      { feature: 'Any Custom Functionality Required', standard: '—', enterprise: 'Included (Full Engineering Support)' },
      { feature: 'Support Channel', standard: 'Priority WhatsApp Support', enterprise: '24/7 Dedicated Support & Slack' },
    ],
  },
];

export const PRICING_FAQ = [
  {
    question: 'Are there any setup fees or hidden costs?',
    answer:
      'Zero setup fees, zero onboarding fees, and zero hidden sales commissions. You only pay the flat launch offer price of ₹699/month (regular ₹1,500/month) for Standard, or your agreed custom plan for Enterprise.',
  },
  {
    question: 'How does the 14-day free trial work?',
    answer:
      'You get complete, unrestricted access to Craviti Standard for 14 full days. No credit card is required to sign up. You can upload your menu and begin taking table orders immediately.',
  },
  {
    question: 'How do bank settlements and payouts work?',
    answer:
      'Online guest payments through Razorpay (UPI, Google Pay, Cards, NetBanking) settle directly into your verified restaurant bank account on an automated T+1 morning schedule.',
  },
  {
    question: 'Can I cancel my subscription at any time?',
    answer:
      'Yes, you can cancel at any time directly through the restaurant portal with one click. There are no lock-in contracts or cancellation penalties.',
  },
  {
    question: 'What is included in Enterprise custom development?',
    answer:
      'Enterprise includes custom engineering from the Craviti product team: integrating your existing POS or ERP, building unique kitchen routing flows, custom loyalty programs, white-label mobile styling, and any bespoke operational requirement your hospitality business demands.',
  },
];
