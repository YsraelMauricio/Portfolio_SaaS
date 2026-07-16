'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApiWithAuth } from '@/app/lib/api';
import type { DashboardMetrics } from '@/app/types/dashboard';

export default function AdminHomePage() {
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
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-[#FAFAFA]">Admin Overview</h1>
      <p className="mt-2 text-zinc-500 dark:text-[rgba(250,250,250,0.6)]">
        Welcome to the admin panel. Manage your projects, contracts, payments, and settings.
      </p>

      {/* Metrics cards */}
      {loading ? (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="mt-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : metrics ? (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
            <p className="text-xs font-medium text-zinc-500 dark:text-[rgba(250,250,250,0.55)] uppercase tracking-wide">
              Active Projects
            </p>
            <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-[#FAFAFA]">
              {Object.entries(metrics.projects_by_status)
                .filter(([status]) => status === 'submitted' || status === 'in_development')
                .reduce((sum, [, count]) => sum + count, 0)}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
            <p className="text-xs font-medium text-zinc-500 dark:text-[rgba(250,250,250,0.55)] uppercase tracking-wide">
              Total Revenue
            </p>
            <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400 tabular-nums">
              ${metrics.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
            <p className="text-xs font-medium text-zinc-500 dark:text-[rgba(250,250,250,0.55)] uppercase tracking-wide">
              Pending Contracts
            </p>
            <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-[#FAFAFA]">
              {metrics.pending_contracts}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
            <p className="text-xs font-medium text-zinc-500 dark:text-[rgba(250,250,250,0.55)] uppercase tracking-wide">
              New Leads This Month
            </p>
            <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-[#FAFAFA]">
              {metrics.new_leads_this_month}
            </p>
          </div>
        </div>
      ) : null}

      {/* Quick links */}
      <h2 className="mt-12 text-lg font-semibold text-zinc-900 dark:text-[#FAFAFA] mb-4">
        Management
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 hover:border-[#6D28D9]/30 transition-colors group"
          >
            <p className="font-semibold text-zinc-900 dark:text-[#FAFAFA] group-hover:text-[#6D28D9] transition-colors">
              {link.label}
            </p>
            <p className="text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.55)] mt-1">
              {link.desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
