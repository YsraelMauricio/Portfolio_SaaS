import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function CookiesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Cookies');

  return (
    <div className="flex flex-col flex-1">
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
        <div className="max-w-4xl mx-auto px-6 py-24 sm:py-32">
          <div className="glass-card p-10 sm:p-14">
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight font-display text-text">
              {t('title')}
            </h1>
          </div>
        </div>
      </section>

      <section className="bg-bg py-16">
        <div className="max-w-3xl mx-auto px-6">
          <div className="prose prose-sm sm:prose-base text-text-muted leading-relaxed space-y-4">
            <p>{t('content')}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
