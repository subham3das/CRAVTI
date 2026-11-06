import env from '../config/env';

export const SITE_CONFIG = {
  name: 'Craviti',
  legalName: 'Craviti Technologies Private Limited',
  tagline: 'The Operating System for Modern Restaurants',
  description:
    'Empower your restaurant with frictionless QR code dining, instantaneous contactless ordering, real-time Kitchen Display Systems, unified settlements, and deep business analytics.',
  url: 'https://craviti.com',
  ogImage: 'https://craviti.com/og-craviti.png',
  appUrl: env.APP_URL,
  adminUrl: env.ADMIN_URL,
  supportEmail: 'contactcraviti@gmail.com',
  salesEmail: 'contactcraviti@gmail.com',
  legalEmail: 'contactcraviti@gmail.com',
  phone: '9954060000',
  address: {
    line1: 'Dibrugarh, Assam, India',
    line2: '',
    city: 'Dibrugarh',
    state: 'Assam',
    pincode: '786001',
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

