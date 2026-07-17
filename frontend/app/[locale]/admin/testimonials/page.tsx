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
        <h1 className="text-3xl font-bold text-text font-display">{t('testimonials')}</h1>
      </div>

      {error && (
        <div className="mt-4 glass-card--light border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
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
            className={`px-4 py-2 text-sm font-medium rounded-lg motion-safe:transition-colors ${
              statusFilter === filter
                ? 'bg-primary text-white'
                : 'glass-card--light text-text-muted hover:border-primary/30'
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
            <div key={i} className="h-24 glass-card--light animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-16 glass-card--light">
              <p className="text-sm text-text-muted">No testimonials found.</p>
            </div>
          ) : (
            filtered.map((testimonial) => (
              <div
                key={testimonial.id}
                className="glass-card--light p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-text">
                        {testimonial.author_name}
                      </p>
                      {testimonial.role && (
                        <span className="text-sm text-text-muted">
                          {testimonial.role}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-text-muted">
                      {testimonial.content}
                    </p>
                    <p className="mt-2 text-xs text-text-muted">
                      {new Date(testimonial.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {testimonial.is_approved ? (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-secondary/20 text-secondary">
                        Approved
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleApprove(testimonial.id)}
                          className="px-3 py-1.5 text-xs font-medium bg-secondary text-white rounded-lg hover:bg-secondary/90 motion-safe:transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(testimonial.id)}
                          className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 motion-safe:transition-colors"
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
