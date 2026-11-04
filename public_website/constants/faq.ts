import { FAQItem } from '../types';

export const GENERAL_FAQ: FAQItem[] = [
  {
    category: 'General',
    question: 'What exactly is Craviti?',
    answer:
      'Craviti is a full-stack restaurant operating system and contactless dining platform. It replaces outdated paper menus and slow billing with digital QR menus, instant guest self-ordering, real-time kitchen displays (KDS), integrated online payments (Razorpay/UPI), table management, and enterprise analytics.',
  },
  {
    category: 'Ordering & Guests',
    question: 'Do my guests need to download an application?',
    answer:
      'Never. Diners simply scan the QR code located on their table using their phone camera. The Craviti mobile menu opens instantly in Safari, Chrome, or any standard mobile browser with zero friction or downloads.',
  },
  {
    category: 'Hardware & Setup',
    question: 'What hardware do I need to run Craviti in my restaurant?',
    answer:
      'Zero proprietary hardware required! You can use any tablet, iPad, Android device, smartphone, or laptop that you already own. We provide print-ready, high-resolution QR placards customized with your restaurant logo and branding.',
  },
  {
    category: 'Kitchen Operations',
    question: 'How do kitchen chefs receive and track incoming orders?',
    answer:
      'Orders placed by guests trigger instant real-time updates via WebSockets onto your kitchen station screens. Configurable acoustic sound chimes alert chefs immediately, displaying order items, customized notes, table numbers, and elapsed prep timers.',
  },
  {
    category: 'Payments & Settlement',
    question: 'Can guests still pay cash, or is it online only?',
    answer:
      'Both! Diners have the flexibility to pay immediately on their phone using UPI, credit/debit cards, and digital wallets, or choose "Pay Cash on Counter". Cashiers have dedicated controls to verify cash receipt and mark bills settled with one click.',
  },
  {
    category: 'Onboarding & Migration',
    question: 'How long does it take to get our restaurant live?',
    answer:
      'Most restaurants go live within 2 to 4 hours. You can either upload your existing menu via our bulk spreadsheet importer or send our dedicated onboarding concierge your current menu PDF/photos, and we will configure it for you completely free.',
  },
  {
    category: 'Security & Reliability',
    question: 'Is our restaurant data and revenue private and secure?',
    answer:
      'Absolutely. Craviti uses bank-grade 256-bit AES encryption in transit and at rest. Every restaurant operates in a strictly isolated tenant environment with automated daily backups and guaranteed 99.99% availability.',
  },
];

