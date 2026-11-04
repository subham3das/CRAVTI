import { notFound } from 'next/navigation';
import { constructMetadata } from '../../lib/seo';
import { LegalLayout } from '../../components/LegalLayout';
import { LEGAL_DOCS } from '../../constants/legal';

export const metadata = constructMetadata({
  title: 'Privacy Policy',
  description: 'How Craviti protects your restaurant data, guest records, and payment information.',
  path: '/privacy-policy',
});

export default function PrivacyPolicyPage() {
  const doc = LEGAL_DOCS['privacy-policy'];
  if (!doc) notFound();
  return <LegalLayout document={doc} />;
}

