'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { fetchBlogPost, fetchBlogComments, submitBlogComment, getAuthToken } from '@/app/lib/api';
import type { BlogPost, BlogComment } from '@/app/types/content';

const PILLAR_LABEL: Record<string, string> = {
  technology: 'Technology',
  business: 'Business',
  design: 'Design',
  devops: 'DevOps',
};

export default function BlogDetailPage() {
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
      <div className="min-h-screen bg-zinc-50 dark:bg-[#09090B] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#09090B]">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <p className="text-red-600 dark:text-red-400 font-medium">{error ?? 'Post not found'}</p>
            <Link href="/blog" className="mt-4 inline-block text-sm text-[#6D28D9] hover:underline">
              {t('backToBlog')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090B]">
      <article className="max-w-3xl mx-auto px-6 py-16">
        <Link
          href="/blog"
          className="text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.55)] hover:text-[#6D28D9] transition-colors"
        >
          {t('backToBlog')}
        </Link>

        {/* Header */}
        <header className="mt-6">
          {post.pillar && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
              {PILLAR_LABEL[post.pillar] ?? post.pillar}
            </span>
          )}
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-[#FAFAFA]">
            {post.title}
          </h1>
          <div className="mt-4 flex items-center gap-4 text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">
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
        <section className="mt-16 border-t border-zinc-200 dark:border-zinc-800 pt-10">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-[#FAFAFA]">
            {t('comments')}
          </h2>

          {comments.length > 0 ? (
            <div className="mt-6 space-y-4">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4"
                >
                  <p className="text-sm font-medium text-zinc-900 dark:text-[#FAFAFA]">
                    {comment.author_name}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {comment.content}
                  </p>
                  <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">
              {t('noComments')}
            </p>
          )}

          {/* Comment form */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-[#FAFAFA]">
              {t('leaveComment')}
            </h3>
            {!isLoggedIn ? (
              <p className="mt-2 text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">
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
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3 text-sm text-green-600 dark:text-green-400">
                    Comment submitted successfully!
                  </div>
                )}
                <textarea
                  required
                  rows={4}
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder={t('commentPlaceholder')}
                  className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-[#FAFAFA] focus:ring-2 focus:ring-[#6D28D9] focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={submittingComment}
                  className="px-6 py-2.5 bg-[#6D28D9] text-white font-medium rounded-lg hover:bg-[#5B21B6] disabled:opacity-50 transition-colors text-sm"
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
