import { notFound } from 'next/navigation';
import { constructMetadata } from '../../lib/seo';
import { LegalLayout } from '../../components/LegalLayout';
import { LEGAL_DOCS } from '../../constants/legal';

export const metadata = constructMetadata({
  title: 'Cookie Policy',
  description: 'How Craviti uses essential cookies and local storage to preserve dining cart sessions.',
  path: '/cookie-policy',
});

export default function CookiePolicyPage() {
  const doc = LEGAL_DOCS['cookie-policy'];
  if (!doc) notFound();
  return <LegalLayout document={doc} />;
}

