import { LegalDocument } from '@/components/legal-document';
import { TERMS } from '@/lib/legal';

export default function TermsScreen() {
  return <LegalDocument doc={TERMS} />;
}
