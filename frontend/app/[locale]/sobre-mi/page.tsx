'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

const skills = [
  'TypeScript / JavaScript',
  'Python',
  'Laravel / PHP',
  'React / Next.js',
  'React Native',
  'Node.js',
  'PostgreSQL',
  'Docker',
  'Tailwind CSS',
  'Git / GitHub',
  'REST / GraphQL APIs',
  'UI / UX Design',
];

export default function AboutPage() {
  const t = useTranslations('About');

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

      {/* Bio */}
      <section className="bg-bg py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="glass-card p-8 sm:p-10">
            <p className="text-base text-text leading-relaxed">
              {t('bio')}
            </p>
          </div>
        </div>
      </section>

      {/* Skills */}
      <section className="bg-bg pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-text font-display mb-10">
            {t('skills')}
          </h2>
          <div className="glass-card p-8 sm:p-10">
            <div className="flex flex-wrap gap-3 justify-center">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="px-4 py-2 text-sm font-medium rounded-full border border-[var(--glass-border)] text-text-muted bg-[var(--surface-rgb)]/10"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Connect / CV */}
      <section className="bg-bg pb-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-text font-display mb-6">
            {t('connect')}
          </h2>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a
              href="/api/v1/cv/download"
              className="px-8 py-3 bg-accent text-[#1E1B2E] font-semibold rounded-lg hover:brightness-110 transition-all"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('downloadCv')}
            </a>
            <Link
              href="/cotizar"
              className="px-8 py-3 border border-[var(--glass-border)] text-text font-semibold rounded-lg hover:bg-white/10 transition-colors"
            >
              {t('cta', { default: 'Get a Quote' })}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
