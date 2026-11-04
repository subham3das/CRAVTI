import { notFound } from 'next/navigation';
import { constructMetadata } from '../../lib/seo';
import { LegalLayout } from '../../components/LegalLayout';
import { LEGAL_DOCS } from '../../constants/legal';

export const metadata = constructMetadata({
  title: 'Customer Terms of Use',
  description: 'Terms governing dining guests who order food and pay bills via Craviti QR codes.',
  path: '/customer-terms',
});

export default function CustomerTermsPage() {
  const doc = LEGAL_DOCS['customer-terms'];
  if (!doc) notFound();
  return <LegalLayout document={doc} />;
}

