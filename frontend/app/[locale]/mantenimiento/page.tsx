'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';

export default function MaintenancePage() {
  const t = useTranslations('Maintenance');
  const [annual, setAnnual] = useState(false);

  const plans = [
    {
      name: t('basic'),
      desc: t('basicDesc'),
      priceMonthly: 49,
      priceAnnual: 499,
      href: '/cotizar?category=maintenance&plan=basic',
    },
    {
      name: t('pro'),
      desc: t('proDesc'),
      priceMonthly: 149,
      priceAnnual: 1499,
      href: '/cotizar?category=maintenance&plan=pro',
      highlighted: true,
    },
    {
      name: t('enterprise'),
      desc: t('enterpriseDesc'),
      priceMonthly: 399,
      priceAnnual: 3999,
      href: '/cotizar?category=maintenance&plan=enterprise',
    },
  ];

  const features = t.raw('features') as string[];

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

      {/* Toggle + Pricing */}
      <section className="bg-bg py-20">
        <div className="max-w-5xl mx-auto px-6">
          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mb-12">
            <span
              className={`text-sm font-medium ${!annual ? 'text-text' : 'text-text-muted'}`}
            >
              {t('monthly')}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={annual}
              aria-label={`Switch to ${annual ? 'monthly' : 'annual'} billing`}
              onClick={() => setAnnual(!annual)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                annual ? 'bg-accent' : 'bg-[var(--glass-border)]'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition-transform ${
                  annual ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
            <span
              className={`text-sm font-medium ${annual ? 'text-text' : 'text-text-muted'}`}
            >
              {t('annual')}
            </span>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`glass-card p-8 flex flex-col ${
                  plan.highlighted
                    ? 'ring-2 ring-accent scale-[1.02] sm:scale-105'
                    : ''
                }`}
              >
                <h3 className="text-xl font-semibold font-display text-text">
                  {plan.name}
                </h3>
                <p className="mt-2 text-sm text-text-muted">{plan.desc}</p>
                <p className="mt-6">
                  <span className="text-3xl font-bold font-mono text-text">
                    ${annual ? plan.priceAnnual : plan.priceMonthly}
                  </span>
                  <span className="text-sm text-text-muted ml-1">
                    /{annual ? 'yr' : 'mo'}
                  </span>
                </p>

                {/* Features */}
                <ul className="mt-6 space-y-3 flex-1">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-text-muted">
                      <svg
                        className="w-4 h-4 mt-0.5 text-accent shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`mt-8 w-full text-center px-6 py-3 font-semibold rounded-lg transition-all text-sm ${
                    plan.highlighted
                      ? 'bg-accent text-[#1E1B2E] hover:brightness-110'
                      : 'border border-[var(--glass-border)] text-text hover:bg-white/10'
                  }`}
                >
                  {t('subscribe')}
                </Link>
              </div>
            ))}
          </div>

          {/* Login note */}
          <p className="mt-10 text-center text-xs text-text-muted">
            {t('loginRequired')}
          </p>
        </div>
      </section>
    </div>
  );
}
