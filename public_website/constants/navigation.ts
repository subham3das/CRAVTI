import { NavItem } from '../types';

export const MAIN_NAV: NavItem[] = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Case Studies', href: '/case-studies' },
  { label: 'Resources', href: '/resources' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export const FOOTER_NAV = {
  product: [
    { label: 'Overview', href: '/' },
    { label: 'Features', href: '/features' },
    { label: 'Pricing & Plans', href: '/pricing' },
    { label: 'Join as Restaurant', href: '/join', badge: 'New' },
    { label: 'Case Studies', href: '/case-studies' },
    { label: 'Security & SLA', href: '/security' },
  ],
  company: [
    { label: 'About Craviti', href: '/about' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Help Center', href: '/help' },
    { label: 'Blog & Insights', href: '/blog' },
    { label: 'Restaurant Onboarding', href: '/join' },
  ],
  resources: [
    { label: 'Resource Hub', href: '/resources' },
    { label: 'ROI Calculator', href: '/resources#roi-calculator' },
    { label: 'Kitchen Display Guide', href: '/resources#kds-guide' },
    { label: 'Customer Retention Playbook', href: '/resources#retention' },
    { label: 'Help Center', href: '/help' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms', href: '/terms-and-conditions' },
    { label: 'Payment Policy', href: '/payment-policy' },
    { label: 'Refund Policy', href: '/refund-policy' },
    { label: 'Merchant Terms', href: '/merchant-terms' },
    { label: 'Cancellation Policy', href: '/cancellation-policy' },
    { label: 'Shipping & Delivery Policy', href: '/shipping-policy' },
    { label: 'Cookie Policy', href: '/cookie-policy' },
    { label: 'Merchant Agreement', href: '/merchant-agreement' },
    { label: 'Customer Terms', href: '/customer-terms' },
    { label: 'Data Processing (DPA)', href: '/data-processing-agreement' },
    { label: 'Security Policy', href: '/security-policy' },
    { label: 'Acceptable Use', href: '/acceptable-use-policy' },
    { label: 'Disclaimer', href: '/disclaimer' },
    { label: 'GDPR Compliance', href: '/gdpr' },
    { label: 'CCPA Privacy', href: '/ccpa' },
  ],
  support: [
    { label: 'Knowledge Base', href: '/help' },
    { label: 'Live System Health', href: '/security#uptime' },
    { label: 'Partner Onboarding', href: '/join' },
    { label: 'Email Support', href: 'mailto:support@craviti.com', external: true },
    { label: 'Merchant Hotline', href: 'tel:+918002728484', external: true },
  ],
};

