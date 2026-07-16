'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { fetchApiWithAuth, fetchApi } from '@/app/lib/api';
import type { BlogPost, BlogComment } from '@/app/types/content';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

const PILLAR_OPTIONS = ['', 'technology', 'business', 'design', 'devops'];

const PILLAR_LABEL: Record<string, string> = {
  technology: 'Technology',
  business: 'Business',
  design: 'Design',
  devops: 'DevOps',
};

const STATUS_BADGE: Record<string, string> = {
  published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  draft: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

export default function AdminBlogPage() {
  const t = useTranslations('Admin');
  const params = useParams();
  const locale = params.locale as string;

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'en' | 'es'>('en');
  const [commentTab, setCommentTab] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    en: { title: '', summary: '', content: '', slug: '' },
    es: { title: '', summary: '', content: '', slug: '' },
    pillar: '',
    featured_image: null as File | null,
  });

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await fetchApi<BlogPost[]>('/blog/posts?per_page=100');
      setPosts(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      // Load comments from all posts — we'll aggregate
      const postsRes = await fetchApi<BlogPost[]>('/blog/posts?per_page=100');
      const allComments: BlogComment[] = [];
      for (const post of postsRes.data) {
        try {
          const res = await fetchApi<BlogComment[]>(`/blog/posts/${post.id}/comments`);
          allComments.push(...res.data);
        } catch {
          // Skip posts that fail
        }
      }
      setComments(allComments);
    } catch {
      // Silently fail
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchApi<BlogPost[]>('/blog/posts?per_page=100');
        if (!cancelled) setPosts(res.data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load posts');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    (async () => {
      try {
        const postsRes = await fetchApi<BlogPost[]>('/blog/posts?per_page=100');
        const allComments: BlogComment[] = [];
        for (const post of postsRes.data) {
          try {
            const res = await fetchApi<BlogComment[]>(`/blog/posts/${post.id}/comments`);
            allComments.push(...res.data);
          } catch {
            // Skip posts that fail
          }
        }
        if (!cancelled) setComments(allComments);
      } catch {
        // Silently fail
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      en: { title: post.title, summary: post.summary, content: post.content, slug: post.slug },
      es: { title: '', summary: '', content: '', slug: '' },
      pillar: post.pillar || '',
      featured_image: null,
    });
    setActiveTab('en');
    setShowForm(true);
  };

  const handleCreateNew = () => {
    setEditingPost(null);
    setFormData({
      en: { title: '', summary: '', content: '', slug: '' },
      es: { title: '', summary: '', content: '', slug: '' },
      pillar: '',
      featured_image: null,
    });
    setActiveTab('en');
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        translations: {
          en: formData.en,
          es: formData.es,
        },
        pillar: formData.pillar || null,
        is_published: true,
      };

      if (editingPost) {
        await fetchApiWithAuth(`/admin/blog/posts/${editingPost.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        const formPayload = new FormData();
        formPayload.append('translations', JSON.stringify(payload.translations));
        formPayload.append('pillar', payload.pillar as string);
        formPayload.append('is_published', '1');
        if (formData.featured_image) {
          formPayload.append('featured_image', formData.featured_image);
        }
        await fetchApiWithAuth('/admin/blog/posts', {
          method: 'POST',
          body: formPayload as unknown as BodyInit,
          headers: {} as Record<string, string>,
        } as RequestInit);
      }
      setShowForm(false);
      loadPosts();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  const handleApproveComment = async (commentId: number) => {
    try {
      await fetchApiWithAuth(`/admin/blog/comments/${commentId}/approve`, { method: 'PATCH' });
      loadComments();
    } catch {
      // Silently fail
    }
  };

  const handleRejectComment = async (commentId: number) => {
    try {
      await fetchApiWithAuth(`/admin/blog/comments/${commentId}/reject`, { method: 'PATCH' });
      loadComments();
    } catch {
      // Silently fail
    }
  };

  const pendingComments = comments.filter((c) => !c.is_approved);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-[#FAFAFA]">{t('blog')}</h1>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setCommentTab(!commentTab)}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Comments ({pendingComments.length})
          </button>
          <button
            type="button"
            onClick={handleCreateNew}
            className="px-4 py-2 text-sm font-medium bg-[#6D28D9] text-white rounded-lg hover:bg-[#5B21B6] transition-colors"
          >
            New Post
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Comment moderation */}
      {commentTab && (
        <div className="mt-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-[#FAFAFA] mb-4">
            Comments ({pendingComments.length} pending)
          </h2>
          {pendingComments.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">No pending comments.</p>
          ) : (
            <div className="space-y-4">
              {pendingComments.map((comment) => (
                <div key={comment.id} className="flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-[#FAFAFA]">{comment.author_name}</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{comment.content}</p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{new Date(comment.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleApproveComment(comment.id)}
                      className="px-3 py-1 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectComment(comment.id)}
                      className="px-3 py-1 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Blog post form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-3xl w-full mt-8 p-6 border border-zinc-200 dark:border-zinc-800 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-[#FAFAFA]">
                {editingPost ? 'Edit Post' : 'Create Post'}
              </h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-zinc-400 hover:text-zinc-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Language tabs */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setActiveTab('en')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'en' ? 'bg-[#6D28D9] text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('es')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'es' ? 'bg-[#6D28D9] text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                Español
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Title ({activeTab === 'en' ? 'English' : 'Spanish'})
                </label>
                <input
                  type="text"
                  required
                  value={formData[activeTab].title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, [activeTab]: { ...prev[activeTab], title: e.target.value } }))}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-[#FAFAFA] focus:ring-2 focus:ring-[#6D28D9] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  required
                  value={formData.en.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, en: { ...prev.en, slug: e.target.value }, es: { ...prev.es, slug: e.target.value } }))}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-[#FAFAFA] focus:ring-2 focus:ring-[#6D28D9] focus:border-transparent font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Summary ({activeTab === 'en' ? 'English' : 'Spanish'})
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData[activeTab].summary}
                  onChange={(e) => setFormData((prev) => ({ ...prev, [activeTab]: { ...prev[activeTab], summary: e.target.value } }))}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-[#FAFAFA] focus:ring-2 focus:ring-[#6D28D9] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Content (HTML, {activeTab === 'en' ? 'English' : 'Spanish'})
                </label>
                <textarea
                  required
                  rows={10}
                  value={formData[activeTab].content}
                  onChange={(e) => setFormData((prev) => ({ ...prev, [activeTab]: { ...prev[activeTab], content: e.target.value } }))}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-[#FAFAFA] focus:ring-2 focus:ring-[#6D28D9] focus:border-transparent font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Pillar
                  </label>
                  <select
                    value={formData.pillar}
                    onChange={(e) => setFormData((prev) => ({ ...prev, pillar: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-[#FAFAFA] focus:ring-2 focus:ring-[#6D28D9] focus:border-transparent"
                  >
                    <option value="">No Pillar</option>
                    {PILLAR_OPTIONS.filter(Boolean).map((p) => (
                      <option key={p} value={p}>{PILLAR_LABEL[p]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Featured Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormData((prev) => ({ ...prev, featured_image: e.target.files?.[0] || null }))}
                    className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#6D28D9]/10 file:text-[#6D28D9] hover:file:bg-[#6D28D9]/20"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 text-sm font-medium bg-[#6D28D9] text-white rounded-lg hover:bg-[#5B21B6] disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Posts list */}
      {loading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="mt-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          {posts.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">
              No blog posts yet.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase tracking-wide">Title</th>
                  <th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase tracking-wide">Pillar</th>
                  <th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase tracking-wide">Status</th>
                  <th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase tracking-wide">Date</th>
                  <th className="text-right p-4 text-xs font-medium text-zinc-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="p-4 text-sm font-medium text-zinc-900 dark:text-[#FAFAFA]">
                      {post.title}
                    </td>
                    <td className="p-4">
                      {post.pillar && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                          {PILLAR_LABEL[post.pillar] ?? post.pillar}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${post.is_published ? STATUS_BADGE.published : STATUS_BADGE.draft}`}>
                        {post.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-zinc-500">
                      {post.published_at ? new Date(post.published_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleEdit(post)}
                        className="px-3 py-1.5 text-xs font-medium text-[#6D28D9] bg-[#6D28D9]/10 rounded-lg hover:bg-[#6D28D9]/20 transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
