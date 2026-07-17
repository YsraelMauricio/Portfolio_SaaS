import type { MetadataRoute } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000/api/v1';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ysraelmauricio.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = ['en', 'es'];
  const entries: MetadataRoute.Sitemap = [];

  // Static routes for each locale
  const staticRoutes = [
    { path: '', priority: 1.0, changeFrequency: 'monthly' as const },
    { path: '/blog', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/portfolio', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/cotizar', priority: 0.8, changeFrequency: 'monthly' as const },
  ];

  for (const locale of locales) {
    const localePrefix = locale === 'en' ? '' : `/${locale}`;
    for (const route of staticRoutes) {
      entries.push({
        url: `${APP_URL}${localePrefix}${route.path}`,
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
      });
    }
  }

  // Dynamic blog posts
  try {
    const blogRes = await fetch(`${API_URL}/blog/posts?limit=100`, {
      signal: AbortSignal.timeout(5000),
    });
    const blogJson = await blogRes.json();
    const posts = blogJson?.data || blogJson || [];

    if (Array.isArray(posts)) {
      for (const locale of locales) {
        const localePrefix = locale === 'en' ? '' : `/${locale}`;
        for (const post of posts) {
          // Backend returns locale-scoped slugs; use the top-level slug if available
          const slug = post.slug;
          if (slug) {
            entries.push({
              url: `${APP_URL}${localePrefix}/blog/${slug}`,
              lastModified: new Date(post.updated_at || post.created_at),
              changeFrequency: 'monthly' as const,
              priority: 0.6,
            });
          }
        }
      }
    }
  } catch (e) {
    console.error('Failed to fetch blog posts for sitemap', e);
  }

  // Dynamic portfolio projects
  try {
    const portfolioRes = await fetch(`${API_URL}/portfolio?limit=100`, {
      signal: AbortSignal.timeout(5000),
    });
    const portfolioJson = await portfolioRes.json();
    const projects = portfolioJson?.data || portfolioJson || [];

    if (Array.isArray(projects)) {
      for (const locale of locales) {
        const localePrefix = locale === 'en' ? '' : `/${locale}`;
        for (const project of projects) {
          const slug = project.slug;
          if (slug) {
            entries.push({
              url: `${APP_URL}${localePrefix}/portfolio/${slug}`,
              lastModified: new Date(project.updated_at || project.created_at),
              changeFrequency: 'monthly' as const,
              priority: 0.7,
            });
          }
        }
      }
    }
  } catch (e) {
    console.error('Failed to fetch portfolio for sitemap', e);
  }

  return entries;
}
