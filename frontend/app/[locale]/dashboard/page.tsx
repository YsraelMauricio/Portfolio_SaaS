'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { fetchApiWithAuth } from '@/app/lib/api';
import type { Project, SavedQuote } from '@/app/types/dashboard';

export default function DashboardHome() {
  const t = useTranslations('Dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentQuotes, setRecentQuotes] = useState<SavedQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [projectsRes, quotesRes] = await Promise.all([
          fetchApiWithAuth<Project[]>('/projects'),
          fetchApiWithAuth<SavedQuote[]>('/quotes/mine'),
        ]);
        setProjects(projectsRes.data);
        setRecentQuotes(quotesRes.data.slice(0, 5));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
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
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
        <p className="text-red-600 dark:text-red-400 font-medium">Error loading dashboard</p>
        <p className="text-sm text-red-500 dark:text-red-300 mt-1">{error}</p>
      </div>
    );
  }

  const activeProjects = projects.filter(
    (p) => p.status === 'submitted' || p.status === 'in_development',
  );
  const deliveredProjects = projects.filter((p) => p.status === 'delivered');

  return (
    <div>
      <h1 className="text-3xl font-bold text-text font-display">{t('title')}</h1>
      <p className="mt-2 text-text-muted">
        {t('welcomeBack')}
      </p>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
        <div className="glass-card--light p-6">
          <p className="text-sm font-medium text-text-muted">{t('activeProjects')}</p>
          <p className="text-3xl font-bold text-text mt-2">{activeProjects.length}</p>
        </div>
        <div className="glass-card--light p-6">
          <p className="text-sm font-medium text-text-muted">{t('deliveredProjects')}</p>
          <p className="text-3xl font-bold text-text mt-2">{deliveredProjects.length}</p>
        </div>
        <div className="glass-card--light p-6">
          <p className="text-sm font-medium text-text-muted">{t('savedQuotes')}</p>
          <p className="text-3xl font-bold text-text mt-2">{recentQuotes.length}</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/dashboard/projects"
          className="flex items-center justify-between p-5 glass-card--light hover:border-primary/30 transition-all group"
        >
          <div>
            <p className="font-semibold text-text">{t('viewProjects')}</p>
            <p className="text-sm text-text-muted mt-1">
              {t('trackProgress')}
            </p>
          </div>
          <span className="text-2xl group-hover:translate-x-1 motion-safe:transition-transform">→</span>
        </Link>
        <Link
          href="/dashboard/quotes"
          className="flex items-center justify-between p-5 glass-card--light hover:border-primary/30 transition-all group"
        >
          <div>
            <p className="font-semibold text-text">{t('savedQuotes')}</p>
            <p className="text-sm text-text-muted mt-1">
              {t('reviewQuotes')}
            </p>
          </div>
          <span className="text-2xl group-hover:translate-x-1 motion-safe:transition-transform">→</span>
        </Link>
      </div>

      {/* Recent quotes */}
      {recentQuotes.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-text mb-4">
            {t('recentQuotes')}
          </h2>
          <div className="glass-card--light divide-y divide-[var(--glass-border)]">
            {recentQuotes.map((quote) => (
              <div key={quote.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-text">
                    {quote.product_type?.name ?? `Quote #${quote.id}`}
                  </p>
                  <p className="text-xs text-text-muted">
                    {new Date(quote.created_at ?? '').toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-primary">
                    ${parseFloat(quote.estimated_price_min).toLocaleString('en-US')}
                    {' – '}
                    ${parseFloat(quote.estimated_price_max).toLocaleString('en-US')}
                  </p>
                  <span className="inline-block text-xs text-text-muted capitalize">
                    {quote.status?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
