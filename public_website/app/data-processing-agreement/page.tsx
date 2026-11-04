import { notFound } from 'next/navigation';
import { constructMetadata } from '../../lib/seo';
import { LegalLayout } from '../../components/LegalLayout';
import { LEGAL_DOCS } from '../../constants/legal';

export const metadata = constructMetadata({
  title: 'Data Processing Agreement (DPA)',
  description: 'Data Processing Agreement governing data controller and processor terms between restaurants and Craviti.',
  path: '/data-processing-agreement',
});

export default function DataProcessingAgreementPage() {
  const doc = LEGAL_DOCS['data-processing-agreement'];
  if (!doc) notFound();
  return <LegalLayout document={doc} />;
}

