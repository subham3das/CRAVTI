import { notFound } from 'next/navigation';
import { constructMetadata } from '../../lib/seo';
import { LegalLayout } from '../../components/LegalLayout';
import { LEGAL_DOCS } from '../../constants/legal';

export const metadata = constructMetadata({
  title: 'CCPA / CPRA Privacy Notice',
  description: 'California Consumer Privacy Act notice and Do Not Sell My Personal Information pledge.',
  path: '/ccpa',
});

export default function CCPAPage() {
  const doc = LEGAL_DOCS['ccpa'];
  if (!doc) notFound();
  return <LegalLayout document={doc} />;
}

