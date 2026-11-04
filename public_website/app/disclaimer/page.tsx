import { notFound } from 'next/navigation';
import { constructMetadata } from '../../lib/seo';
import { LegalLayout } from '../../components/LegalLayout';
import { LEGAL_DOCS } from '../../constants/legal';

export const metadata = constructMetadata({
  title: 'Disclaimer',
  description: 'Allergen, food preparation, and third-party payment gateway legal disclaimers.',
  path: '/disclaimer',
});

export default function DisclaimerPage() {
  const doc = LEGAL_DOCS['disclaimer'];
  if (!doc) notFound();
  return <LegalLayout document={doc} />;
}

