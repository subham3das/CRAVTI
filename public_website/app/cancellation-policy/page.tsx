import { notFound } from 'next/navigation';
import { constructMetadata } from '../../lib/seo';
import { LegalLayout } from '../../components/LegalLayout';
import { LEGAL_DOCS } from '../../constants/legal';

export const metadata = constructMetadata({
  title: 'Cancellation Policy',
  description: 'How to cancel your Craviti restaurant subscription and export historical reports.',
  path: '/cancellation-policy',
});

export default function CancellationPolicyPage() {
  const doc = LEGAL_DOCS['cancellation-policy'];
  if (!doc) notFound();
  return <LegalLayout document={doc} />;
}

