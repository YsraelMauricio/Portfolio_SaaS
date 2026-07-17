'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
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
  submitted: 'statusSubmitted',
  in_development: 'statusInDevelopment',
  delivered: 'statusDelivered',
  cancelled: 'statusCancelled',
};

export default function ClientProjectsPage() {
  const t = useTranslations('Dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApiWithAuth<Project[]>('/projects')
      .then((res) => setProjects(res.data))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load projects'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full motion-safe:animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-text font-display">{t('myProjects')}</h1>
      <p className="mt-2 text-text-muted">
        {t('trackProgress')}
      </p>

      {projects.length === 0 ? (
        <div className="mt-8 text-center py-16 glass-card--light">
          <p className="text-text-muted">{t('noProjects')}</p>
          <Link
            href="/cotizar"
            className="mt-3 inline-block px-6 py-2.5 bg-accent text-[#1E1B2E] font-medium rounded-lg hover:brightness-110 transition-all text-sm"
          >
            {t('getQuote')}
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="block glass-card--light p-5 hover:border-primary/30 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-text">
                    Project #{project.id}
                  </h3>
                  <p className="text-sm text-text-muted mt-1">
                    Created {new Date(project.created_at ?? '').toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[project.status] ?? 'bg-zinc-100 text-zinc-800'}`}
                >
                  {t(STATUS_LABEL[project.status]) ?? project.status}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-6 text-sm text-text-muted">
                {project.confirmed_delivery_date && (
                  <span>
                    Est. delivery:{' '}
                    {new Date(project.confirmed_delivery_date).toLocaleDateString()}
                  </span>
                )}
                <span>Paused days: {project.paused_days}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
