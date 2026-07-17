'use client';

import { useEffect, useState } from 'react';
import { fetchApiWithAuth } from '@/app/lib/api';
import type { Project } from '@/app/types/dashboard';

const STATUS_BADGE: Record<string, string> = {
  submitted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  in_development: 'bg-accent/20 text-accent',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export default function AdminContractsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Create contract modal
  const [showCreate, setShowCreate] = useState(false);
  const [createProjectId, setCreateProjectId] = useState('');
  const [createOverride, setCreateOverride] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const projectsRes = await fetchApiWithAuth<Project[]>('/projects');
        setProjects(projectsRes.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(0);
    setActionError(null);
    try {
      const body: Record<string, unknown> = { project_id: Number(createProjectId) };
      if (createOverride.trim()) {
        try {
          body.quote_snapshot_override = JSON.parse(createOverride);
        } catch {
          setActionError('Invalid JSON in quote snapshot override');
          setActionLoading(null);
          return;
        }
      }
      await fetchApiWithAuth('/admin/contracts', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setShowCreate(false);
      setCreateProjectId('');
      setCreateOverride('');
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to create contract');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full motion-safe:animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-text font-display">Contracts</h1>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 motion-safe:transition-colors"
        >
          Create Contract
        </button>
      </div>

      {error && (
        <div className="mt-4 glass-card--light border border-red-200 dark:border-red-800 p-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {actionError && (
        <div className="mt-4 glass-card--light border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {actionError}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="glass-card--light max-w-lg w-full p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-text font-display mb-4">
              Create Contract
            </h2>
            <form onSubmit={handleCreateContract} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">
                  Project ID
                </label>
                <input
                  type="number"
                  required
                  value={createProjectId}
                  onChange={(e) => setCreateProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--glass-border)] glass-card--light text-sm text-text placeholder-text-muted focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter project ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">
                  Quote Snapshot Override (JSON, optional)
                </label>
                <textarea
                  value={createOverride}
                  onChange={(e) => setCreateOverride(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--glass-border)] glass-card--light text-sm text-text placeholder-text-muted focus:ring-2 focus:ring-primary focus:border-transparent font-mono"
                  placeholder='{"product_type_name": "Custom", "price_usd": 5000, ...}'
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--glass-border)] text-text-muted hover:bg-bg/50 motion-safe:transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 0}
                  className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 motion-safe:transition-colors"
                >
                  {actionLoading === 0 ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Projects list */}
      <div className="mt-6 space-y-4">
        {projects.length === 0 ? (
          <div className="text-center py-16 glass-card--light">
            <p className="text-sm text-text-muted">
              No projects yet.
            </p>
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className="glass-card--light p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-text">
                    Project #{project.id}
                  </p>
                  <p className="text-xs text-text-muted">
                    Client: {project.user?.name ?? `User #${project.user_id}`}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[project.status] ?? ''}`}
                >
                  {project.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
