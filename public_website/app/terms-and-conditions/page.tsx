import { notFound } from 'next/navigation';
import { constructMetadata } from '../../lib/seo';
import { LegalLayout } from '../../components/LegalLayout';
import { LEGAL_DOCS } from '../../constants/legal';

export const metadata = constructMetadata({
  title: 'Terms and Conditions',
  description: 'Terms and conditions governing the use of the Craviti restaurant operating platform.',
  path: '/terms-and-conditions',
});

export default function TermsAndConditionsPage() {
  const doc = LEGAL_DOCS['terms-and-conditions'];
  if (!doc) notFound();
  return <LegalLayout document={doc} />;
}

