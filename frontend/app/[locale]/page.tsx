import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Globe, Smartphone, Monitor } from 'lucide-react';
import TestimonialsSection from '@/app/[locale]/components/TestimonialsSection';
import FeaturedPortfolio from '@/app/[locale]/components/FeaturedPortfolio';
import TestimonialsCarousel from '@/app/[locale]/components/TestimonialsCarousel';

const SERVICE_ITEMS = [
  { key: 'web', Icon: Globe },
  { key: 'mobile', Icon: Smartphone },
  { key: 'desktop', Icon: Monitor },
] as const;

export default async function HomePage() {
  const t = await getTranslations('Home');

  return (
    <div className="flex flex-col flex-1">
      {/* Hero section */}
      <section className="relative overflow-hidden">
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
                className="px-8 py-3 bg-accent text-bg font-semibold rounded-xl hover:brightness-110 transition-all"
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

      {/* Services - lightweight glass grid */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-text text-center mb-4">
            {t('servicesTitle')}
          </h2>
          <p className="text-text-muted text-center max-w-xl mx-auto mb-12">
            {t('servicesSubtitle')}
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {SERVICE_ITEMS.map(({ key, Icon }) => (
              <div
                key={key}
                className="glass-card--light p-8 text-center"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-accent/15 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-accent" strokeWidth={1.75} />
                </div>
                <h3 className="font-display font-semibold text-text mb-2">{t(`service.${key}.title`)}</h3>
                <p className="text-sm text-text-muted">{t(`service.${key}.description`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Portfolio */}
      <section className="py-20 px-6 bg-black/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-display font-bold text-text">{t('featuredWorkTitle')}</h2>
            <Link href="/portfolio" className="text-accent hover:underline text-sm font-medium">
              {t('viewAll')} →
            </Link>
          </div>
          <FeaturedPortfolio />
        </div>
      </section>

      {/* Testimonials carousel */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-text text-center mb-12">
            {t('testimonialsTitle')}
          </h2>
          <TestimonialsCarousel />
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto glass-card p-12 text-center">
          <h2 className="text-3xl font-display font-bold text-text mb-4">{t('finalCtaTitle')}</h2>
          <p className="text-text-muted mb-8">{t('finalCtaSubtitle')}</p>
          <Link
            href="/cotizar"
            className="inline-block px-8 py-3 bg-accent text-bg font-semibold rounded-xl hover:brightness-110 transition-all"
          >
            {t('ctaGetQuote')}
          </Link>
        </div>
      </section>
    </div>
  );
}
