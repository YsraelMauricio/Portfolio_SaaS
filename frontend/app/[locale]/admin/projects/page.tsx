'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { fetchApiWithAuth } from '@/app/lib/api';
import type { Project, PaginationMeta } from '@/app/types/dashboard';

const STATUS_BADGE: Record<string, string> = {
  submitted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  in_development: 'bg-accent/20 text-accent',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_LABEL: Record<string, string> = {
  submitted: 'Submitted',
  in_development: 'In Development',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_OPTIONS = ['', 'submitted', 'in_development', 'delivered', 'cancelled'];

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const query = new URLSearchParams();
        if (statusFilter) query.set('status', statusFilter);
        query.set('page', String(page));

        const res = await fetchApiWithAuth<Project[]>(`/projects?${query.toString()}`);
        setProjects(res.data);
        setMeta(res.meta as unknown as PaginationMeta);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    })();
  }, [statusFilter, page]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-text font-display">Projects</h1>
        <span className="text-sm text-text-muted">
          {meta ? `${meta.total} total` : ''}
        </span>
      </div>

      {/* Filters */}
      <div className="mt-6 flex items-center gap-4">
        <label className="text-sm font-medium text-text-muted">Status:</label>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-[var(--glass-border)] glass-card--light text-sm text-text focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s] ?? s}
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-6 glass-card--light border border-red-200 dark:border-red-800 p-6">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 glass-card--light animate-pulse" />
          ))}
        </div>
      )}

      {/* Projects table */}
      {!loading && !error && (
        <div className="mt-6 glass-card--light overflow-hidden">
          {projects.length === 0 ? (
            <div className="p-8 text-center text-sm text-text-muted">
              No projects found.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--glass-border)] bg-text-muted/10">
                  <th className="text-left p-4 text-xs font-medium text-text-muted uppercase tracking-wide">ID</th>
                  <th className="text-left p-4 text-xs font-medium text-text-muted uppercase tracking-wide">Client</th>
                  <th className="text-left p-4 text-xs font-medium text-text-muted uppercase tracking-wide">Status</th>
                  <th className="text-left p-4 text-xs font-medium text-text-muted uppercase tracking-wide">Created</th>
                  <th className="text-right p-4 text-xs font-medium text-text-muted uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--glass-border)]">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-text-muted/5 motion-safe:transition-colors">
                    <td className="p-4 text-sm font-medium text-text">
                      #{project.id}
                    </td>
                    <td className="p-4 text-sm text-text-muted">
                      {project.user?.name ?? `User #${project.user_id}`}
                      <br />
                      <span className="text-xs text-text-muted/70">
                        {project.user?.email}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[project.status] ?? ''}`}
                      >
                        {STATUS_LABEL[project.status] ?? project.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-text-muted">
                      {new Date(project.created_at ?? '').toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/admin/projects/${project.id}`}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 motion-safe:transition-colors"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--glass-border)] text-text-muted disabled:opacity-50 hover:bg-bg/50 motion-safe:transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-text-muted">
            Page {meta.current_page} of {meta.last_page}
          </span>
          <button
            type="button"
            disabled={page >= meta.last_page}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--glass-border)] text-text-muted disabled:opacity-50 hover:bg-bg/50 motion-safe:transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
