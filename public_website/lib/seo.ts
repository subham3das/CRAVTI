import type { Metadata } from 'next';
import { SITE_CONFIG } from '../constants/site';

interface SEOProps {
  title?: string;
  description?: string;
  path?: string;
  ogImage?: string;
  keywords?: string[];
}

export function constructMetadata({
  title,
  description = SITE_CONFIG.description,
  path = '',
  ogImage = SITE_CONFIG.ogImage,
  keywords = [
    'Restaurant POS',
    'QR Code Ordering',
    'Contactless Dining',
    'Kitchen Display System',
    'KDS',
    'Razorpay Restaurant Settlement',
    'Digital Menu',
    'Restaurant Analytics',
    'Craviti',
  ],
}: SEOProps = {}): Metadata {
  const url = `${SITE_CONFIG.url}${path}`;
  const fullTitle = title
    ? `${title} | ${SITE_CONFIG.name}`
    : `${SITE_CONFIG.name} — ${SITE_CONFIG.tagline}`;

  return {
    title: fullTitle,
    description,
    keywords,
    authors: [{ name: SITE_CONFIG.name }],
    creator: SITE_CONFIG.name,
    metadataBase: new URL(SITE_CONFIG.url),
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url,
      title: fullTitle,
      description,
      siteName: SITE_CONFIG.name,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage],
      creator: '@cravitiapp',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

