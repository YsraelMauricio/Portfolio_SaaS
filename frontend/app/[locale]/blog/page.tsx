'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { fetchBlogPosts } from '@/app/lib/api';
import type { BlogPost, PaginationMeta } from '@/app/types/content';

const PILLARS = ['', 'technology', 'business', 'design', 'devops'];

const PILLAR_LABEL: Record<string, string> = {
  technology: 'Technology',
  business: 'Business',
  design: 'Design',
  devops: 'DevOps',
};

export default function BlogListPage() {
  const t = useTranslations('Blog');
  const tc = useTranslations('Common');
  const params = useParams();
  const locale = params.locale as string;

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pillar, setPillar] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchBlogPosts(locale, pillar || undefined, page);
        if (!cancelled) {
          setPosts(res.data);
          setMeta(res.meta as unknown as PaginationMeta);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load posts');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locale, pillar, page]);

  return (
    <div className="min-h-dvh bg-bg">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-text font-display">{t('title')}</h1>
        <p className="mt-2 text-text-muted">{t('subtitle')}</p>

        {/* Pillar filter tabs */}
        <div className="mt-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => { setPillar(''); setPage(1); }}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
              !pillar
                ? 'bg-primary text-white'
                : 'glass-card--light text-text-muted border border-[var(--glass-border)] hover:border-primary/30'
            }`}
          >
            {t('allPillars')}
          </button>
          {PILLARS.filter(Boolean).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => { setPillar(p); setPage(1); }}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                pillar === p
                  ? 'bg-primary text-white'
                  : 'glass-card--light text-text-muted border border-[var(--glass-border)] hover:border-primary/30'
              }`}
            >
              {PILLAR_LABEL[p] ?? p}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mt-8 space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 glass-card--light animate-pulse" />
            ))}
          </div>
        )}

        {/* Posts list */}
        {!loading && !error && (
          <>
            {posts.length === 0 ? (
              <div className="mt-12 text-center py-16 glass-card--light">
                <p className="text-text-muted">{t('noPosts')}</p>
              </div>
            ) : (
              <div className="mt-8 space-y-6">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="block glass-card--light overflow-hidden hover:border-primary/30 transition-all group"
                  >
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        {post.pillar && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {PILLAR_LABEL[post.pillar] ?? post.pillar}
                          </span>
                        )}
                        {post.published_at && (
                          <span className="text-xs text-text-muted">
                            {t('publishedOn', { date: new Date(post.published_at).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) })}
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl font-semibold text-text group-hover:text-primary transition-colors">
                        {post.title}
                      </h2>
                      <p className="mt-2 text-sm text-text-muted line-clamp-2">
                        {post.summary}
                      </p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-text-muted">
                          {t('byAuthor', { name: post.author_name })}
                        </span>
                        <span className="text-sm font-medium text-primary group-hover:underline">
                          {t('readMore')} →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {meta && meta.last_page > 1 && (
              <div className="mt-10 flex items-center justify-center gap-4">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2 text-sm font-medium rounded-lg glass-card--light text-text-muted disabled:opacity-50 hover:border-accent/30 transition-all"
                >
                  {tc('previous')}
                </button>
                <span className="text-sm text-text-muted">
                  {tc('pageXofY', { current: meta.current_page, total: meta.last_page })}
                </span>
                <button
                  type="button"
                  disabled={page >= meta.last_page}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 text-sm font-medium rounded-lg glass-card--light text-text-muted disabled:opacity-50 hover:border-accent/30 transition-all"
                >
                  {tc('next')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
