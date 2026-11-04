import { notFound } from 'next/navigation';
import { constructMetadata } from '../../lib/seo';
import { LegalLayout } from '../../components/LegalLayout';
import { LEGAL_DOCS } from '../../constants/legal';

export const metadata = constructMetadata({
  title: 'Security Policy',
  description: 'Technical security controls, encryption protocols, and vulnerability disclosure standards.',
  path: '/security-policy',
});

export default function SecurityPolicyPage() {
  const doc = LEGAL_DOCS['security-policy'];
  if (!doc) notFound();
  return <LegalLayout document={doc} />;
}

