import { notFound } from 'next/navigation';
import { constructMetadata } from '../../lib/seo';
import { LegalLayout } from '../../components/LegalLayout';
import { LEGAL_DOCS } from '../../constants/legal';

export const metadata = constructMetadata({
  title: 'Shipping and Delivery Policy',
  description: 'How Craviti delivers digital software services, QR table hardware, and merchant collateral.',
  path: '/shipping-policy',
});

export default function ShippingPolicyPage() {
  const doc = LEGAL_DOCS['shipping-policy'];
  if (!doc) notFound();
  return <LegalLayout document={doc} />;
}
