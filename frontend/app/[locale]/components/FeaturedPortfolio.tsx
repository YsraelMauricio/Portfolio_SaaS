import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

interface PortfolioItem {
  slug: string;
  title: string;
  key_result: string | null;
  technologies: string[];
  featured_image_url: string | null;
}

export default async function FeaturedPortfolio() {
  const t = await getTranslations('Home');
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/portfolio?featured=true`, {
    next: { revalidate: 3600 },
  });
  const { data: items }: { data: PortfolioItem[] } = await res.json();

  return (
    <div className="grid sm:grid-cols-3 gap-6">
      {items.slice(0, 3).map((item) => (
        <Link key={item.slug} href={`/portfolio/${item.slug}`} className="group glass-card--light overflow-hidden block">
          {item.featured_image_url && (
            <div className="relative aspect-video overflow-hidden">
              <Image
                src={item.featured_image_url}
                alt={item.title}
                fill
                sizes="(max-width: 640px) 100vw, 33vw"
                className="object-cover motion-safe:transition-transform motion-safe:duration-300 group-hover:scale-105"
              />
            </div>
          )}
          <div className="p-5">
            <h3 className="font-display font-semibold text-text">{item.title}</h3>
            {item.key_result && <p className="text-sm text-accent mt-1">{item.key_result}</p>}
          </div>
        </Link>
      ))}
      {items.length === 0 && (
        <p className="col-span-3 text-center text-text-muted text-sm">{t('noFeaturedYet')}</p>
      )}
    </div>
  );
}
