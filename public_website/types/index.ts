export interface NavItem {
  label: string;
  href: string;
  badge?: string;
  external?: boolean;
}

export interface FeatureItem {
  id: string;
  title: string;
  tagline: string;
  description: string;
  iconName: string;
  bulletPoints: string[];
  metrics?: {
    value: string;
    label: string;
  };
  mockupType: 'dashboard' | 'qr' | 'kds' | 'analytics' | 'tables' | 'receipt';
}

export interface PricingPlan {
  id: string;
  name: string;
  tagline: string;
  priceDisplay: string;
  pricePeriod?: string;
  features: string[];
  enterprisePlus?: string[];
  ctaText: string;
  ctaHref: string;
  variant?: 'standard' | 'enterprise';
}

export interface Testimonial {
  id: string;
  author: string;
  role: string;
  restaurant: string;
  location: string;
  avatar: string;
  quote: string;
  metrics: {
    stat: string;
    label: string;
  };
  rating: number;
}

export interface FAQItem {
  question: string;
  answer: string;
  category?: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  summary: string;
  category: string;
  readTime: string;
  date: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  coverImage: string;
  content: string;
}

export interface CaseStudy {
  slug: string;
  restaurantName: string;
  tagline: string;
  location: string;
  cuisine: string;
  tables: number;
  heroImage: string;
  summary: string;
  challenges: string[];
  solutions: string[];
  results: {
    stat: string;
    label: string;
  }[];
  testimonialQuote: string;
  author: string;
}

export interface LegalSection {
  id: string;
  title: string;
  content: string;
}

export interface LegalDocument {
  title: string;
  slug: string;
  lastUpdated: string;
  effectiveDate: string;
  summary: string;
  sections: LegalSection[];
}

