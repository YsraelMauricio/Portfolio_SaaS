import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import PortfolioDetailClient from './PortfolioDetailClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000/api/v1';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ysraelmauricio.com';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;

  try {
    const res = await fetch(`${API_URL}/portfolio/${slug}?locale=${locale}`, {
      cache: 'no-store',
    });
    const json = await res.json();
    const project = json?.data || json;

    return {
      title: project?.title || slug,
      description: project?.description || '',
      alternates: {
        canonical: `${APP_URL}${locale === 'en' ? '' : `/${locale}`}/portfolio/${slug}`,
      },
      openGraph: {
        title: project?.title,
        description: project?.description,
        type: 'website',
        ...(project?.featured_image_url ? { images: [{ url: project.featured_image_url }] } : {}),
      },
    };
  } catch {
    return { title: slug };
  }
}

export default async function PortfolioDetailPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PortfolioDetailClient />;
}
