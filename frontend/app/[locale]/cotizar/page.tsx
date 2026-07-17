import type { Metadata } from 'next';
import QuoteWizard from '@/app/[locale]/components/QuoteWizard';

export const metadata: Metadata = {
  title: 'Get a Quote — Portfolio SaaS',
  description:
    'Configure your project, choose options, and get an instant price and timeline estimate.',
};

export default function CotizarPage() {
  return (
    <main className="min-h-dvh">
      <QuoteWizard />
    </main>
  );
}
