import { notFound } from 'next/navigation';
import { constructMetadata } from '../../lib/seo';
import { LegalLayout } from '../../components/LegalLayout';
import { LEGAL_DOCS } from '../../constants/legal';

export const metadata = constructMetadata({
  title: 'Merchant Terms & Service Agreement',
  description:
    'Official terms governing restaurant partnerships, KYC verification, order processing, and automated bank settlements via Razorpay on the Craviti platform.',
  path: '/merchant-terms',
});

export default function MerchantTermsPage() {
  const doc = LEGAL_DOCS['merchant-terms'] || LEGAL_DOCS['merchant-agreement'];
  if (!doc) notFound();
  return <LegalLayout document={doc} />;
}
