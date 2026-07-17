'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { fetchApiWithAuth } from '@/app/lib/api';
import type { Project } from '@/app/types/dashboard';

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

export default function ClientProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApiWithAuth<Project>(`/projects/${projectId}`)
      .then((res) => setProject(res.data))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load project'))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full motion-safe:animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <p className="text-red-600 dark:text-red-400 font-medium">
          {error ?? 'Project not found'}
        </p>
        <Link
          href="/dashboard/projects"
          className="mt-4 inline-block text-sm text-[#6D28D9] hover:underline"
        >
          ← Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/dashboard/projects"
        className="text-sm text-text-muted hover:text-primary transition-colors"
      >
        ← Back to Projects
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text font-display">
            Project #{project.id}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Created {new Date(project.created_at ?? '').toLocaleDateString()}
          </p>
        </div>
        <span
          className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium ${STATUS_BADGE[project.status] ?? 'bg-zinc-100 text-zinc-800'}`}
        >
          {STATUS_LABEL[project.status] ?? project.status}
        </span>
      </div>

      {/* Details grid */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-card--light p-5">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
            Status
          </p>
          <p className="mt-2 text-lg font-semibold text-text">
            {STATUS_LABEL[project.status] ?? project.status}
          </p>
        </div>

        <div className="glass-card--light p-5">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
            Paused Days
          </p>
          <p className="mt-2 text-lg font-semibold text-text">
            {project.paused_days}
          </p>
        </div>

        <div className="glass-card--light p-5">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
            Scope Changed
          </p>
          <p className="mt-2 text-lg font-semibold text-text">
            {project.scope_changed ? 'Yes' : 'No'}
          </p>
        </div>
      </div>

      {/* Dates */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {project.actual_start_date && (
          <div className="glass-card--light p-5">
            <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
              Start Date
            </p>
            <p className="mt-1 text-sm text-text">
              {new Date(project.actual_start_date).toLocaleDateString()}
            </p>
          </div>
        )}
        {project.confirmed_delivery_date && (
          <div className="glass-card--light p-5">
            <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
              Est. Delivery Date
            </p>
            <p className="mt-1 text-sm text-text">
              {new Date(project.confirmed_delivery_date).toLocaleDateString()}
            </p>
          </div>
        )}
        {project.actual_delivery_date && (
          <div className="glass-card--light p-5">
            <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
              Actual Delivery Date
            </p>
            <p className="mt-1 text-sm text-text">
              {new Date(project.actual_delivery_date).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      {/* Milestones Timeline */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-text mb-4">
          Milestones
        </h2>
        {project.milestones && project.milestones.length > 0 ? (
          <div className="space-y-3">
            {project.milestones
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((milestone, index) => (
                <div
                  key={milestone.id}
                  className="flex items-start gap-4 glass-card--light p-4"
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        milestone.completed_date
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-[var(--surface-rgb)] text-text-muted'
                      }`}
                    >
                      {index + 1}
                    </div>
                    {index < project.milestones!.length - 1 && (
                      <div className="w-0.5 flex-1 bg-[var(--glass-border)] mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm font-medium text-text">
                      {milestone.name}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {milestone.completed_date
                        ? `Completed: ${new Date(milestone.completed_date).toLocaleDateString()}`
                        : `Estimated: ${new Date(milestone.estimated_date).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted">
            No milestones defined yet.
          </p>
        )}
      </div>
    </div>
  );
}
