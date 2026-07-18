'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import TestimonialsSection from '@/app/[locale]/components/TestimonialsSection';

export default function HomePage() {
  const t = useTranslations('Home');

  return (
    <div className="flex flex-col flex-1">
      {/* Hero section */}
      <section className="relative overflow-hidden">
        {/* Fondo mesh-gradient — el vidrio necesita algo rico detrás para refractar */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: `
              radial-gradient(circle at 20% 20%, rgba(109, 40, 217, 0.18), transparent 45%),
              radial-gradient(circle at 80% 30%, rgba(91, 33, 182, 0.25), transparent 50%),
              radial-gradient(circle at 50% 80%, rgba(0, 212, 255, 0.14), transparent 45%),
              var(--bg)
            `,
          }}
        />
        <div className="max-w-5xl mx-auto px-6 py-24 sm:py-32">
          <div className="glass-card p-10 sm:p-14 text-center">
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight font-display text-text">
              {t('heroTitle')}
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-text-muted max-w-2xl mx-auto">
              {t('heroSubtitle')}
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/cotizar"
                className="px-8 py-3 bg-accent text-[#1E1B2E] font-semibold rounded-lg hover:brightness-110 transition-all"
              >
                {t('ctaGetQuote')}
              </Link>
              <Link
                href="/portfolio"
                className="px-8 py-3 border border-[var(--glass-border)] text-text font-semibold rounded-lg hover:bg-white/10 transition-colors"
              >
                {t('ctaViewPortfolio')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="bg-bg py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-text font-display">
            {t('featureTitle')}
          </h2>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-text">{t('featureQuality')}</h3>
              <p className="mt-2 text-sm text-text-muted">{t('featureQualityDesc')}</p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-text">{t('featureTimely')}</h3>
              <p className="mt-2 text-sm text-text-muted">{t('featureTimelyDesc')}</p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 0l-3.536-3.536m3.536 3.536L9.172 15.536m0 0L5.636 12" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-text">{t('featureSupport')}</h3>
              <p className="mt-2 text-sm text-text-muted">{t('featureSupportDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials section */}
      <section className="bg-bg py-20">
        <div className="max-w-5xl mx-auto px-6">
          <TestimonialsSection />
        </div>
      </section>
    </div>
  );
}
