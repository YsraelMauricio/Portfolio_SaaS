'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import TestimonialsSection from '@/app/[locale]/components/TestimonialsSection';

export default function HomePage() {
  const t = useTranslations('Home');

  return (
    <div className="flex flex-col flex-1">
      {/* Hero section */}
      <section className="bg-gradient-to-br from-[#6D28D9] via-[#5B21B6] to-[#4C1D95] text-white">
        <div className="max-w-5xl mx-auto px-6 py-24 sm:py-32 text-center">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
            {t('heroTitle')}
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-purple-200 max-w-2xl mx-auto">
            {t('heroSubtitle')}
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/cotizar"
              className="px-8 py-3 bg-white text-[#6D28D9] font-semibold rounded-lg hover:bg-purple-50 transition-colors"
            >
              {t('ctaGetQuote')}
            </Link>
            <Link
              href="/portfolio"
              className="px-8 py-3 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
            >
              {t('ctaViewPortfolio')}
            </Link>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="bg-white dark:bg-zinc-900 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-zinc-900 dark:text-[#FAFAFA]">
            {t('featureTitle')}
          </h2>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-[#6D28D9]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-[#FAFAFA]">{t('featureQuality')}</h3>
              <p className="mt-2 text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.6)]">{t('featureQualityDesc')}</p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-[#6D28D9]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-[#FAFAFA]">{t('featureTimely')}</h3>
              <p className="mt-2 text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.6)]">{t('featureTimelyDesc')}</p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-[#6D28D9]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 0l-3.536-3.536m3.536 3.536L9.172 15.536m0 0L5.636 12" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-[#FAFAFA]">{t('featureSupport')}</h3>
              <p className="mt-2 text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.6)]">{t('featureSupportDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials section */}
      <section className="bg-zinc-50 dark:bg-[#09090B] py-20">
        <div className="max-w-5xl mx-auto px-6">
          <TestimonialsSection />
        </div>
      </section>
    </div>
  );
}
