'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Script from 'next/script';
import { Link } from '@/i18n/navigation';
import { fetchBlogPost, fetchBlogComments, submitBlogComment, getAuthToken } from '@/app/lib/api';
import type { BlogPost, BlogComment } from '@/app/types/content';

const PILLAR_LABEL: Record<string, string> = {
  technology: 'Technology',
  business: 'Business',
  design: 'Design',
  devops: 'DevOps',
};

export default function BlogDetailClient() {
  const t = useTranslations('Blog');
  const params = useParams();
  const slug = params.slug as string;
  const locale = params.locale as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentSuccess, setCommentSuccess] = useState(false);

  const isLoggedIn = !!getAuthToken();

  useEffect(() => {
    (async () => {
      try {
        const postRes = await fetchBlogPost(slug, locale);
        setPost(postRes.data);
        const commentsRes = await fetchBlogComments(postRes.data.id);
        setComments(commentsRes.data.filter((c) => c.is_approved));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load post');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, locale]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !commentContent.trim()) return;

    setSubmittingComment(true);
    setCommentError(null);
    setCommentSuccess(false);

    try {
      await submitBlogComment(post.id, { content: commentContent });
      setCommentContent('');
      setCommentSuccess(true);
      setTimeout(() => setCommentSuccess(false), 3000);
    } catch (e) {
      setCommentError(e instanceof Error ? e.message : 'Failed to submit comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full motion-safe:animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-dvh bg-bg">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <p className="text-red-600 dark:text-red-400 font-medium">{error ?? 'Post not found'}</p>
            <Link href="/blog" className="mt-4 inline-block text-sm text-primary hover:underline">
              {t('backToBlog')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.summary || post.title,
    datePublished: post.published_at || post.created_at,
    author: {
      '@type': 'Person',
      name: post.author_name || 'Ysrael Mauricio',
    },
    ...(post.featured_image_url ? { image: post.featured_image_url } : {}),
  };

  return (
    <div className="min-h-dvh bg-bg">
      {/* Article JSON-LD structured data */}
      <Script
        id="schema-article"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <article className="max-w-3xl mx-auto px-6 py-16">
        <Link
          href="/blog"
          className="text-sm text-text-muted hover:text-primary transition-colors"
        >
          {t('backToBlog')}
        </Link>

        {/* Header */}
        <header className="mt-6">
          {post.pillar && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {PILLAR_LABEL[post.pillar] ?? post.pillar}
            </span>
          )}
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-text font-display">
            {post.title}
          </h1>
          <div className="mt-4 flex items-center gap-4 text-sm text-text-muted">
            <span>{t('byAuthor', { name: post.author_name })}</span>
            {post.published_at && (
              <span>
                {t('publishedOn', { date: new Date(post.published_at).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) })}
              </span>
            )}
          </div>
        </header>

        {/* Featured image */}
        {post.featured_image_url && (
          <div className="mt-8 rounded-xl overflow-hidden">
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div
          className="mt-10 prose prose-zinc dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Comments Section */}
        <section className="mt-16 border-t border-[var(--glass-border)] pt-10">
          <h2 className="text-xl font-semibold text-text">
            {t('comments')}
          </h2>

          {comments.length > 0 ? (
            <div className="mt-6 space-y-4">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="glass-card--light p-4"
                >
                  <p className="text-sm font-medium text-text">
                    {comment.author_name}
                  </p>
                  <p className="mt-1 text-sm text-text-muted">
                    {comment.content}
                  </p>
                  <p className="mt-2 text-xs text-text-muted">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-text-muted">
              {t('noComments')}
            </p>
          )}

          {/* Comment form */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-text">
              {t('leaveComment')}
            </h3>
            {!isLoggedIn ? (
              <p className="mt-2 text-sm text-text-muted">
                {t('loginToComment')}
              </p>
            ) : (
              <form onSubmit={handleSubmitComment} className="mt-4 space-y-4">
                {commentError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-red-600 dark:text-red-400">
                    {commentError}
                  </div>
                )}
                {commentSuccess && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3 text-sm text-secondary">
                    Comment submitted successfully!
                  </div>
                )}
                <textarea
                  required
                  rows={4}
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder={t('commentPlaceholder')}
                  className="w-full px-4 py-3 rounded-lg glass-card--light text-text placeholder-text-muted focus:ring-2 focus:ring-accent focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={submittingComment}
                  className="px-6 py-2.5 bg-accent text-[#1E1B2E] font-medium rounded-lg hover:brightness-110 disabled:opacity-50 transition-all text-sm"
                >
                  {submittingComment ? 'Submitting...' : t('submitComment')}
                </button>
              </form>
            )}
          </div>
        </section>
      </article>
    </div>
  );
}
