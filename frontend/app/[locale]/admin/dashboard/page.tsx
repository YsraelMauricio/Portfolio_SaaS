'use client';

import { useEffect, useState } from 'react';
import { fetchApiWithAuth } from '@/app/lib/api';
import type { DashboardMetrics, RecalibrationItem } from '@/app/types/dashboard';

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-yellow-400',
  in_development: 'bg-blue-400',
  delivered: 'bg-green-400',
  cancelled: 'bg-red-400',
};

const STATUS_LABEL: Record<string, string> = {
  submitted: 'Submitted',
  in_development: 'In Development',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function SparkBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recalibration, setRecalibration] = useState<RecalibrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [metricsRes, recalRes] = await Promise.all([
          fetchApiWithAuth<DashboardMetrics>('/admin/dashboard/metrics'),
          fetchApiWithAuth<RecalibrationItem[]>('/admin/dashboard/recalibration'),
        ]);
        setMetrics(metricsRes.data);
        setRecalibration(recalRes.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
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

  const statusEntries = metrics
    ? Object.entries(metrics.projects_by_status).sort(([a], [b]) => a.localeCompare(b))
    : [];
  const maxStatusValue = Math.max(...statusEntries.map(([, v]) => v), 1);

  return (
    <div>
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-[#FAFAFA]">
        Business Intelligence Dashboard
      </h1>
      <p className="mt-2 text-zinc-500 dark:text-[rgba(250,250,250,0.6])">
        Key metrics, project distribution, and recalibration data for quarterly feedback.
      </p>

      {/* Metric cards */}
      {metrics && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
            <p className="text-xs font-medium text-zinc-500 dark:text-[rgba(250,250,250,0.55)] uppercase tracking-wide">
              Total Revenue
            </p>
            <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400 tabular-nums">
              ${metrics.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
            <p className="text-xs font-medium text-zinc-500 dark:text-[rgba(250,250,250,0.55)] uppercase tracking-wide">
              Active Projects
            </p>
            <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
              {Object.entries(metrics.projects_by_status)
                .filter(([s]) => s === 'submitted' || s === 'in_development')
                .reduce((sum, [, v]) => sum + v, 0)}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
            <p className="text-xs font-medium text-zinc-500 dark:text-[rgba(250,250,250,0.55)] uppercase tracking-wide">
              Pending Contracts
            </p>
            <p className="mt-2 text-3xl font-bold text-yellow-600 dark:text-yellow-400 tabular-nums">
              {metrics.pending_contracts}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
            <p className="text-xs font-medium text-zinc-500 dark:text-[rgba(250,250,250,0.55)] uppercase tracking-wide">
              Leads This Month
            </p>
            <p className="mt-2 text-3xl font-bold text-[#6D28D9] dark:text-[#6D28D9] tabular-nums">
              {metrics.new_leads_this_month}
            </p>
          </div>
        </div>
      )}

      {/* Average delivery time */}
      {metrics && metrics.average_delivery_days !== null && (
        <div className="mt-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <p className="text-xs font-medium text-zinc-500 dark:text-[rgba(250,250,250,0.55)] uppercase tracking-wide">
            Average Delivery Time
          </p>
          <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-[#FAFAFA] tabular-nums">
            {metrics.average_delivery_days} <span className="text-base font-normal text-zinc-500">days</span>
          </p>
        </div>
      )}

      {/* Project status distribution */}
      <div className="mt-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-[#FAFAFA] mb-4">
          Project Status Distribution
        </h2>
        {statusEntries.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500">No projects found.</p>
        ) : (
          <div className="space-y-4">
            {statusEntries.map(([status, count]) => (
              <div key={status}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {STATUS_LABEL[status] ?? status}
                  </span>
                  <span className="text-zinc-500 dark:text-[rgba(250,250,250,0.55)] tabular-nums">
                    {count}
                  </span>
                </div>
                <SparkBar
                  value={count}
                  max={maxStatusValue}
                  color={STATUS_COLORS[status] ?? 'bg-zinc-400'}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recalibration table */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-[#FAFAFA] mb-4">
          Quoted vs. Actual — Recalibration Data
        </h2>
        <p className="text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.55)] mb-4">
          Comparison of quoted delivery dates vs. actual delivery for delivered projects
          where scope did not change. High deviations indicate categories that may need
          recalibration.
        </p>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          {recalibration.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">
              No recalibration data available yet. Data appears once delivered projects have
              signed contracts with quote snapshots.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="text-left p-4 text-xs font-medium text-zinc-500 dark:text-[rgba(250,250,250,0.55)] uppercase tracking-wide">Project</th>
                  <th className="text-left p-4 text-xs font-medium text-zinc-500 dark:text-[rgba(250,250,250,0.55)] uppercase tracking-wide">Product Type</th>
                  <th className="text-right p-4 text-xs font-medium text-zinc-500 dark:text-[rgba(250,250,250,0.55)] uppercase tracking-wide">Quoted Price</th>
                  <th className="text-left p-4 text-xs font-medium text-zinc-500 dark:text-[rgba(250,250,250,0.55)] uppercase tracking-wide">Confirmed Delivery</th>
                  <th className="text-left p-4 text-xs font-medium text-zinc-500 dark:text-[rgba(250,250,250,0.55)] uppercase tracking-wide">Actual Delivery</th>
                  <th className="text-right p-4 text-xs font-medium text-zinc-500 dark:text-[rgba(250,250,250,0.55)] uppercase tracking-wide">Deviation (days)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {recalibration.map((item) => (
                  <tr key={item.project_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="p-4 text-sm font-medium text-zinc-900 dark:text-[#FAFAFA]">
                      #{item.project_id}
                    </td>
                    <td className="p-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {item.product_type_name}
                    </td>
                    <td className="p-4 text-sm text-right tabular-nums text-zinc-900 dark:text-[#FAFAFA]">
                      ${item.quoted_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">
                      {new Date(item.confirmed_delivery_date).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">
                      {new Date(item.actual_delivery_date).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tabular-nums ${
                          item.deviation_days > 0
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : item.deviation_days < 0
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}
                      >
                        {item.deviation_days > 0 ? '+' : ''}
                        {item.deviation_days}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
