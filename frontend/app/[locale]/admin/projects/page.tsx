'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { fetchApiWithAuth } from '@/app/lib/api';
import type { Project, PaginationMeta } from '@/app/types/dashboard';

const STATUS_BADGE: Record<string, string> = {
  submitted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  in_development: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
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
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-[#FAFAFA]">Projects</h1>
        <span className="text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">
          {meta ? `${meta.total} total` : ''}
        </span>
      </div>

      {/* Filters */}
      <div className="mt-6 flex items-center gap-4">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Status:</label>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-[#FAFAFA] focus:ring-2 focus:ring-[#6D28D9] focus:border-transparent"
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
        <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Projects table */}
      {!loading && !error && (
        <div className="mt-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          {projects.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">
              No projects found.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="text-left p-4 text-xs font-medium text-zinc-500 dark:text-[rgba(250,250,250,0.55)] uppercase tracking-wide">ID</th>
                  <th className="text-left p-4 text-xs font-medium text-zinc-500 dark:text-[rgba(250,250,250,0.55)] uppercase tracking-wide">Client</th>
                  <th className="text-left p-4 text-xs font-medium text-zinc-500 dark:text-[rgba(250,250,250,0.55)] uppercase tracking-wide">Status</th>
                  <th className="text-left p-4 text-xs font-medium text-zinc-500 dark:text-[rgba(250,250,250,0.55)] uppercase tracking-wide">Created</th>
                  <th className="text-right p-4 text-xs font-medium text-zinc-500 dark:text-[rgba(250,250,250,0.55)] uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="p-4 text-sm font-medium text-zinc-900 dark:text-[#FAFAFA]">
                      #{project.id}
                    </td>
                    <td className="p-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {project.user?.name ?? `User #${project.user_id}`}
                      <br />
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">
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
                    <td className="p-4 text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">
                      {new Date(project.created_at ?? '').toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/admin/projects/${project.id}`}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-[#6D28D9] bg-[#6D28D9]/10 rounded-lg hover:bg-[#6D28D9]/20 transition-colors"
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
            className="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">
            Page {meta.current_page} of {meta.last_page}
          </span>
          <button
            type="button"
            disabled={page >= meta.last_page}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
