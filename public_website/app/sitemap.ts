import { MetadataRoute } from 'next';
import { SITE_CONFIG } from '../constants/site';
import { BLOG_POSTS } from '../constants/blog';
import { CASE_STUDIES } from '../constants/caseStudies';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_CONFIG.url;

  const corePages = [
    '',
    '/features',
    '/pricing',
    '/about',
    '/contact',
    '/blog',
    '/resources',
    '/help',
    '/security',
    '/case-studies',
    '/join',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  const legalPages = [
    '/privacy-policy',
    '/terms-and-conditions',
    '/refund-policy',
    '/merchant-terms',
    '/merchant-agreement',
    '/payment-policy',
    '/cancellation-policy',
    '/shipping-policy',
    '/cookie-policy',
    '/data-processing-agreement',
    '/security-policy',
    '/customer-terms',
    '/acceptable-use-policy',
    '/disclaimer',
    '/gdpr',
    '/ccpa',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  const blogPages = BLOG_POSTS.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const caseStudyPages = CASE_STUDIES.map((study) => ({
    url: `${baseUrl}/case-studies/${study.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...corePages, ...legalPages, ...blogPages, ...caseStudyPages];
}

