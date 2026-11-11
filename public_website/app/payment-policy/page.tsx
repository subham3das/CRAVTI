import { notFound } from 'next/navigation';
import { constructMetadata } from '../../lib/seo';
import { LegalLayout } from '../../components/LegalLayout';
import { LEGAL_DOCS } from '../../constants/legal';

export const metadata = constructMetadata({
  title: 'Payment & Settlement Policy',
  description:
    'Comprehensive guide to Craviti secure payment processing via Razorpay, zero sensitive credential storage, supported payment methods, and merchant bank settlement timelines.',
  path: '/payment-policy',
});

export default function PaymentPolicyPage() {
  const doc = LEGAL_DOCS['payment-policy'];
  if (!doc) notFound();
  return <LegalLayout document={doc} />;
}
