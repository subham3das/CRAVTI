export const SITE_CONFIG = {
  name: 'Craviti',
  legalName: 'Craviti Technologies Private Limited',
  tagline: 'The Operating System for Modern Restaurants',
  description:
    'Empower your restaurant with frictionless QR code dining, instantaneous contactless ordering, real-time Kitchen Display Systems, unified settlements, and deep business analytics.',
  url: 'https://craviti.com',
  ogImage: 'https://craviti.com/og-craviti.png',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://cravti.vercel.app',
  adminUrl: process.env.NEXT_PUBLIC_ADMIN_URL || 'https://cravti-admin.vercel.app',
  supportEmail: 'support@craviti.com',
  salesEmail: 'sales@craviti.com',
  legalEmail: 'legal@craviti.com',
  phone: '+91 (800) 272-8484',
  address: {
    line1: 'Craviti Innovation Tower, 4th Floor',
    line2: 'Outer Ring Road, Bellandur',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560103',
    country: 'India',
  },
  socials: {
    twitter: 'https://twitter.com/cravitiapp',
    linkedin: 'https://linkedin.com/company/craviti',
    instagram: 'https://instagram.com/craviti.dining',
    youtube: 'https://youtube.com/@craviti',
    github: 'https://github.com/craviti',
  },
  stats: {
    restaurants: '2,400+',
    ordersProcessed: '18M+',
    turnaroundReduction: '35%',
    revenueGrowth: '+28%',
    uptime: '99.99%',
  },
};

