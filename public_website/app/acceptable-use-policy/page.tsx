import { notFound } from 'next/navigation';
import { constructMetadata } from '../../lib/seo';
import { LegalLayout } from '../../components/LegalLayout';
import { LEGAL_DOCS } from '../../constants/legal';

export const metadata = constructMetadata({
  title: 'Acceptable Use Policy (AUP)',
  description: 'Rules and prohibited actions on the Craviti platform and digital menu network.',
  path: '/acceptable-use-policy',
});

export default function AcceptableUsePolicyPage() {
  const doc = LEGAL_DOCS['acceptable-use-policy'];
  if (!doc) notFound();
  return <LegalLayout document={doc} />;
}

