import { notFound } from 'next/navigation';
import { constructMetadata } from '../../lib/seo';
import { LegalLayout } from '../../components/LegalLayout';
import { LEGAL_DOCS } from '../../constants/legal';

export const metadata = constructMetadata({
  title: 'Refund Policy',
  description: 'Craviti software subscription refund terms and guest billing dispute policies.',
  path: '/refund-policy',
});

export default function RefundPolicyPage() {
  const doc = LEGAL_DOCS['refund-policy'];
  if (!doc) notFound();
  return <LegalLayout document={doc} />;
}

