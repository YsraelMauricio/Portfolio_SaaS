import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Script from 'next/script';
import QuoteWizard from '@/app/[locale]/components/QuoteWizard';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ysraelmauricio.com';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: 'Get a Quote',
    description:
      'Configure your project, choose options, and get an instant price and timeline estimate for custom software development services.',
    alternates: {
      canonical: `${APP_URL}${locale === 'en' ? '' : `/${locale}`}/cotizar`,
    },
  };
}

export default async function CotizarPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Software Development Services',
    provider: {
      '@type': 'Person',
      name: 'Ysrael Mauricio',
    },
    description:
      'Custom software development including web, mobile, and desktop applications.',
    areaServed: ['US', 'BO'],
  };

  return (
    <main className="min-h-dvh">
      <Script
        id="schema-service"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <QuoteWizard />
    </main>
  );
}
