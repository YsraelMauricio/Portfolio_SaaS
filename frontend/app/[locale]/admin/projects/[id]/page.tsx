'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { fetchApiWithAuth } from '@/app/lib/api';
import type { Project } from '@/app/types/dashboard';

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

const STATUS_TRANSITIONS: Record<string, string[]> = {
  submitted: ['in_development', 'cancelled'],
  in_development: ['delivered', 'cancelled'],
};

export default function AdminProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // New milestone form
  const [newMilestone, setNewMilestone] = useState({ name: '', estimated_date: '', sort_order: 0 });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchApiWithAuth<Project>(`/projects/${projectId}`);
        setProject(res.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load project');
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const res = await fetchApiWithAuth<Project>(`/projects/${projectId}`);
      setProject(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load project');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setActionLoading(`status-${newStatus}`);
    setActionError(null);
    try {
      const res = await fetchApiWithAuth<Project>(`/admin/projects/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setProject(res.data);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleScopeChanged = async () => {
    if (!project) return;
    setActionLoading('scope');
    setActionError(null);
    try {
      const res = await fetchApiWithAuth<Project>(`/admin/projects/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({ scope_changed: !project.scope_changed }),
      });
      setProject(res.data);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to update scope');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePauseClock = async () => {
    setActionLoading('pause');
    setActionError(null);
    try {
      await fetchApiWithAuth(`/admin/projects/${projectId}/pause-clock`, {
        method: 'PATCH',
      });
      await loadProject();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to pause clock');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('milestone');
    setActionError(null);
    try {
      await fetchApiWithAuth(`/admin/projects/${projectId}/milestones`, {
        method: 'POST',
        body: JSON.stringify(newMilestone),
      });
      setNewMilestone({ name: '', estimated_date: '', sort_order: 0 });
      await loadProject();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to create milestone');
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

  if (error || !project) {
    return (
      <div className="glass-card--light border border-red-200 dark:border-red-800 p-6">
        <p className="text-red-600 dark:text-red-400 font-medium">{error ?? 'Project not found'}</p>
        <Link href="/admin/projects" className="mt-4 inline-block text-sm text-primary hover:underline">
          ← Back to Projects
        </Link>
      </div>
    );
  }

  const isTerminal = project.status === 'delivered' || project.status === 'cancelled';
  const availableTransitions = STATUS_TRANSITIONS[project.status] ?? [];

  return (
    <div>
      <Link
        href="/admin/projects"
        className="text-sm text-text-muted hover:text-primary motion-safe:transition-colors"
      >
        ← Back to Projects
      </Link>

      {/* Header */}
      <div className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text font-display">
            Project #{project.id}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Client: {project.user?.name ?? `User #${project.user_id}`} ({project.user?.email})
          </p>
        </div>
        <span
          className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium ${STATUS_BADGE[project.status] ?? ''}`}
        >
          {STATUS_LABEL[project.status] ?? project.status}
        </span>
      </div>

      {/* Action error */}
      {actionError && (
        <div className="mt-4 glass-card--light border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {actionError}
        </div>
      )}

      {/* Status transitions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-text font-display mb-4">Actions</h2>
        <div className="flex flex-wrap gap-3">
          {!isTerminal &&
            availableTransitions.map((status) => (
              <button
                key={status}
                type="button"
                disabled={actionLoading !== null}
                onClick={() => handleStatusChange(status)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 motion-safe:transition-colors"
              >
                {actionLoading === `status-${status}` ? 'Updating...' : `Mark as ${STATUS_LABEL[status] ?? status}`}
              </button>
            ))}

          {project.status === 'delivered' && (
            <span className="inline-flex items-center px-4 py-2 text-sm text-secondary bg-secondary/10 rounded-lg">
              Delivered
            </span>
          )}

          <button
            type="button"
            disabled={actionLoading !== null}
            onClick={handlePauseClock}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--glass-border)] text-text-muted hover:bg-bg/50 disabled:opacity-50 motion-safe:transition-colors"
          >
            {actionLoading === 'pause' ? 'Pausing...' : `Pause Clock (${project.paused_days})`}
          </button>

          <button
            type="button"
            disabled={actionLoading !== null}
            onClick={handleToggleScopeChanged}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--glass-border)] text-text-muted hover:bg-bg/50 disabled:opacity-50 motion-safe:transition-colors"
          >
            {actionLoading === 'scope'
              ? 'Updating...'
              : `Scope Changed: ${project.scope_changed ? 'Yes' : 'No'}`}
          </button>
        </div>
      </div>

      {/* Project info */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-card--light p-5">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Paused Days</p>
          <p className="mt-2 text-2xl font-bold text-text">{project.paused_days}</p>
        </div>
        <div className="glass-card--light p-5">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">is_test</p>
          <p className="mt-2 text-2xl font-bold text-text">{project.is_test ? 'Yes' : 'No'}</p>
        </div>
        <div className="glass-card--light p-5">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Scope Changed</p>
          <p className="mt-2 text-2xl font-bold text-text">{project.scope_changed ? 'Yes' : 'No'}</p>
        </div>
      </div>

      {/* Milestones */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-text font-display mb-4">Milestones</h2>

        {project.milestones && project.milestones.length > 0 ? (
          <div className="space-y-2">
            {project.milestones
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between glass-card--light p-4"
                >
                  <div>
                    <p className="text-sm font-medium text-text">{m.name}</p>
                    <p className="text-xs text-text-muted">
                      Est: {new Date(m.estimated_date).toLocaleDateString()}
                      {m.completed_date && ` | Completed: ${new Date(m.completed_date).toLocaleDateString()}`}
                    </p>
                  </div>
                  <span className="text-xs text-text-muted">Order: {m.sort_order}</span>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted">No milestones yet.</p>
        )}

        {/* Add milestone form */}
        <form onSubmit={handleCreateMilestone} className="mt-4 glass-card--light p-5">
          <h3 className="text-sm font-semibold text-text font-display mb-3">Add Milestone</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              placeholder="Milestone name"
              value={newMilestone.name}
              onChange={(e) => setNewMilestone((prev) => ({ ...prev, name: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-[var(--glass-border)] glass-card--light text-sm text-text placeholder-text-muted focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <input
              type="date"
              required
              value={newMilestone.estimated_date}
              onChange={(e) => setNewMilestone((prev) => ({ ...prev, estimated_date: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-[var(--glass-border)] glass-card--light text-sm text-text focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <div className="flex gap-2">
              <input
                type="number"
                required
                placeholder="Sort order"
                value={newMilestone.sort_order}
                onChange={(e) => setNewMilestone((prev) => ({ ...prev, sort_order: Number(e.target.value) }))}
                className="flex-1 px-3 py-2 rounded-lg border border-[var(--glass-border)] glass-card--light text-sm text-text placeholder-text-muted focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                type="submit"
                disabled={actionLoading === 'milestone'}
                className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 motion-safe:transition-colors"
              >
                {actionLoading === 'milestone' ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
