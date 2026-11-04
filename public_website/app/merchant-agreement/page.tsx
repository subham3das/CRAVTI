import { notFound } from 'next/navigation';
import { constructMetadata } from '../../lib/seo';
import { LegalLayout } from '../../components/LegalLayout';
import { LEGAL_DOCS } from '../../constants/legal';

export const metadata = constructMetadata({
  title: 'Merchant Agreement',
  description: 'Merchant terms governing restaurant operations, bank verification, and payout processing.',
  path: '/merchant-agreement',
});

export default function MerchantAgreementPage() {
  const doc = LEGAL_DOCS['merchant-agreement'];
  if (!doc) notFound();
  return <LegalLayout document={doc} />;
}

