import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget';
import ThemeScript from './components/ThemeScript';
import Script from 'next/script';
import '../globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
  variable: '--font-display',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-body',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-mono',
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ysraelmauricio.com';

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: {
      default: t('title'),
      template: `%s | ${t('brand')}`,
    },
    description: t('description'),
    alternates: {
      canonical: `${APP_URL}${locale === routing.defaultLocale ? '' : `/${locale}`}`,
      languages: {
        en: `${APP_URL}/`,
        es: `${APP_URL}/es`,
      },
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      locale: locale === 'es' ? 'es_BO' : 'en_US',
      siteName: 'Ysrael Mauricio',
      type: 'website',
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is valid
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  const messages = await getMessages();

  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Ysrael Mauricio',
    url: `${APP_URL}${locale === routing.defaultLocale ? '' : `/${locale}`}`,
    jobTitle: 'Software Developer',
    knowsAbout: ['Software Development', 'Artificial Intelligence', 'Web Development', 'Mobile Development'],
    sameAs: [
      'https://github.com/YsraelMauricio',
    ],
  };

  return (
    <html
      lang={locale}
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {/* Inline theme-sync script — runs before any paint to prevent FOUC */}
        <ThemeScript />

        {/* JSON-LD structured data for Person/Organization */}
        <Script
          id="schema-person"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />

        {/* Mesh gradient background — always present behind glass surfaces */}
        <div
          className="fixed inset-0 -z-10 pointer-events-none"
          aria-hidden="true"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 0% 0%, rgba(109, 40, 217, 0.15) 0%, transparent 60%),
              radial-gradient(ellipse 60% 50% at 100% 20%, rgba(0, 212, 255, 0.10) 0%, transparent 50%),
              radial-gradient(ellipse 50% 40% at 50% 100%, rgba(52, 211, 153, 0.08) 0%, transparent 50%)
            `,
          }}
        />

        <NextIntlClientProvider messages={messages}>
          <Navigation />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
          <ChatWidget />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
