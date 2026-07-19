'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function ServicesPage() {
  const t = useTranslations('Services');

  const services = [
    {
      title: t('webTitle'),
      desc: t('webDesc'),
      href: '/cotizar',
    },
    {
      title: t('mobileTitle'),
      desc: t('mobileDesc'),
      href: '/cotizar',
    },
    {
      title: t('desktopTitle'),
      desc: t('desktopDesc'),
      href: '/cotizar',
    },
    {
      title: t('maintenanceTitle'),
      desc: t('maintenanceDesc'),
      href: '/mantenimiento',
    },
  ];

  return (
    <div className="flex flex-col flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: `
              radial-gradient(circle at 20% 20%, rgba(109, 40, 217, 0.18), transparent 45%),
              radial-gradient(circle at 80% 30%, rgba(0, 212, 255, 0.14), transparent 50%),
              var(--bg)
            `,
          }}
        />
        <div className="max-w-5xl mx-auto px-6 py-24 sm:py-32">
          <div className="glass-card p-10 sm:p-14 text-center">
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight font-display text-text">
              {t('title')}
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-text-muted max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Services grid */}
      <section className="bg-bg py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {services.map((service) => (
              <div key={service.title} className="glass-card p-8 flex flex-col">
                <h3 className="text-xl font-semibold font-display text-text">
                  {service.title}
                </h3>
                <p className="mt-3 text-sm text-text-muted flex-1">
                  {service.desc}
                </p>
                <Link
                  href={service.href}
                  className="mt-6 inline-flex self-start px-6 py-2.5 bg-accent text-[#1E1B2E] font-semibold rounded-lg hover:brightness-110 transition-all text-sm"
                >
                  {t('cta')}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
