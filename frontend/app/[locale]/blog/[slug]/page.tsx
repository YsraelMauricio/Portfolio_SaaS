import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import BlogDetailClient from './BlogDetailClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000/api/v1';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ysraelmauricio.com';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;

  try {
    const res = await fetch(`${API_URL}/blog/posts/${slug}?locale=${locale}`, {
      cache: 'no-store',
    });
    const json = await res.json();
    const post = json?.data || json;

    return {
      title: post?.title || slug,
      description: post?.meta_description || post?.summary || '',
      alternates: {
        canonical: `${APP_URL}${locale === 'en' ? '' : `/${locale}`}/blog/${slug}`,
      },
      openGraph: {
        title: post?.title,
        description: post?.meta_description || post?.summary,
        type: 'article',
        publishedTime: post?.published_at || post?.created_at,
        ...(post?.featured_image_url ? { images: [{ url: post.featured_image_url }] } : {}),
      },
    };
  } catch {
    return { title: slug };
  }
}

export default async function BlogDetailPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <BlogDetailClient />;
}
