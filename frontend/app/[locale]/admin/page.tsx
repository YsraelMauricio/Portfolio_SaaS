'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { fetchApiWithAuth } from '@/app/lib/api';
import type { DashboardMetrics } from '@/app/types/dashboard';

export default function AdminHomePage() {
  const t = useTranslations('Admin');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApiWithAuth<DashboardMetrics>('/admin/dashboard/metrics')
      .then((res) => setMetrics(res.data))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load metrics'))
      .finally(() => setLoading(false));
  }, []);

  const quickLinks = [
    {
      href: '/admin/projects',
      label: 'Manage Projects',
      desc: 'View all projects, update statuses, manage milestones',
    },
    {
      href: '/admin/contracts',
      label: 'Contracts',
      desc: 'Create contracts, approve and send for signing',
    },
    {
      href: '/admin/payments',
      label: 'Payments',
      desc: 'View payments, confirm bank transfers',
    },
    {
      href: '/admin/dashboard',
      label: 'BI Dashboard',
      desc: 'Business metrics, recalibration data, and insights',
    },
    {
      href: '/admin/settings',
      label: 'Settings',
      desc: 'Manage site-wide configuration',
    },
    {
      href: '/admin/deleted-users',
      label: 'Deleted Users',
      desc: 'View users within the retention window',
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-text">{t('overview')}</h1>
      <p className="mt-2 text-text-muted">
        {t('welcome')}
      </p>

      {/* Metrics cards */}
      {loading ? (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 glass-card--light animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="mt-8 glass-card--light border border-red-200 dark:border-red-800 p-6">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : metrics ? (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card--light p-5">
            <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
              Active Projects
            </p>
            <p className="mt-2 text-3xl font-bold text-text">
              {Object.entries(metrics.projects_by_status)
                .filter(([status]) => status === 'submitted' || status === 'in_development')
                .reduce((sum, [, count]) => sum + count, 0)}
            </p>
          </div>

          <div className="glass-card--light p-5">
            <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
              Total Revenue
            </p>
            <p className="mt-2 text-3xl font-bold text-secondary tabular-nums">
              ${metrics.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="glass-card--light p-5">
            <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
              Pending Contracts
            </p>
            <p className="mt-2 text-3xl font-bold text-text">
              {metrics.pending_contracts}
            </p>
          </div>

          <div className="glass-card--light p-5">
            <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
              New Leads This Month
            </p>
            <p className="mt-2 text-3xl font-bold text-text">
              {metrics.new_leads_this_month}
            </p>
          </div>
        </div>
      ) : null}

      {/* Quick links */}
      <h2 className="mt-12 text-lg font-semibold text-text font-display mb-4">
        Management
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block glass-card--light p-5 hover:border-primary/30 motion-safe:transition-colors group"
          >
            <p className="font-semibold text-text group-hover:text-primary motion-safe:transition-colors">
              {link.label}
            </p>
            <p className="text-sm text-text-muted mt-1">
              {link.desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
