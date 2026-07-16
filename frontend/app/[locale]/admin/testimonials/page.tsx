'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { fetchApiWithAuth, fetchApi } from '@/app/lib/api';
import type { Testimonial } from '@/app/types/content';

export default function AdminTestimonialsPage() {
  const t = useTranslations('Admin');

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const loadTestimonials = async () => {
    setLoading(true);
    try {
      const res = await fetchApi<Testimonial[]>('/testimonials');
      setTestimonials(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchApi<Testimonial[]>('/testimonials');
        if (!cancelled) setTestimonials(res.data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load testimonials');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleApprove = async (id: number) => {
    try {
      await fetchApiWithAuth(`/admin/testimonials/${id}/approve`, { method: 'PATCH' });
      loadTestimonials();
    } catch {
      setError('Failed to approve testimonial');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await fetchApiWithAuth(`/admin/testimonials/${id}/reject`, { method: 'PATCH' });
      loadTestimonials();
    } catch {
      setError('Failed to reject testimonial');
    }
  };

  const filtered = testimonials.filter((t) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return !t.is_approved;
    if (statusFilter === 'approved') return t.is_approved;
    return false;
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-[#FAFAFA]">{t('testimonials')}</h1>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Status filter */}
      <div className="mt-6 flex gap-2">
        {(['all', 'pending', 'approved'] as const).map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setStatusFilter(filter)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              statusFilter === filter
                ? 'bg-[#6D28D9] text-white'
                : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-[#6D28D9]/30'
            }`}
          >
            {filter === 'all' ? 'All' : filter === 'pending' ? `Pending (${testimonials.filter((t) => !t.is_approved).length})` : 'Approved'}
          </button>
        ))}
      </div>

      {/* Testimonials list */}
      {loading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <p className="text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">No testimonials found.</p>
            </div>
          ) : (
            filtered.map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-zinc-900 dark:text-[#FAFAFA]">
                        {testimonial.author_name}
                      </p>
                      {testimonial.role && (
                        <span className="text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">
                          {testimonial.role}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {testimonial.content}
                    </p>
                    <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                      {new Date(testimonial.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {testimonial.is_approved ? (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Approved
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleApprove(testimonial.id)}
                          className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(testimonial.id)}
                          className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
