import { notFound } from 'next/navigation';
import { constructMetadata } from '../../lib/seo';
import { LegalLayout } from '../../components/LegalLayout';
import { LEGAL_DOCS } from '../../constants/legal';

export const metadata = constructMetadata({
  title: 'GDPR Compliance Statement',
  description: 'Adherence to General Data Protection Regulation (GDPR) for international dining guests.',
  path: '/gdpr',
});

export default function GDPRPage() {
  const doc = LEGAL_DOCS['gdpr'];
  if (!doc) notFound();
  return <LegalLayout document={doc} />;
}

