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
    <div className="w-full h-2 bg-text-muted/20 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full motion-safe:transition-all motion-safe:duration-500 ${color}`}
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
        <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full motion-safe:animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card--light border border-red-200 dark:border-red-800 p-6">
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
      <h1 className="text-3xl font-bold text-text font-display">
        Business Intelligence Dashboard
      </h1>
      <p className="mt-2 text-text-muted">
        Key metrics, project distribution, and recalibration data for quarterly feedback.
      </p>

      {/* Metric cards */}
      {metrics && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card--light p-6">
            <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
              Total Revenue
            </p>
            <p className="mt-2 text-3xl font-bold text-secondary tabular-nums">
              ${metrics.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="glass-card--light p-6">
            <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
              Active Projects
            </p>
            <p className="mt-2 text-3xl font-bold text-accent tabular-nums">
              {Object.entries(metrics.projects_by_status)
                .filter(([s]) => s === 'submitted' || s === 'in_development')
                .reduce((sum, [, v]) => sum + v, 0)}
            </p>
          </div>

          <div className="glass-card--light p-6">
            <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
              Pending Contracts
            </p>
            <p className="mt-2 text-3xl font-bold text-text tabular-nums">
              {metrics.pending_contracts}
            </p>
          </div>

          <div className="glass-card--light p-6">
            <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
              Leads This Month
            </p>
            <p className="mt-2 text-3xl font-bold text-primary tabular-nums">
              {metrics.new_leads_this_month}
            </p>
          </div>
        </div>
      )}

      {/* Average delivery time */}
      {metrics && metrics.average_delivery_days !== null && (
        <div className="mt-6 glass-card--light p-6">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
            Average Delivery Time
          </p>
          <p className="mt-2 text-3xl font-bold text-text tabular-nums">
            {metrics.average_delivery_days} <span className="text-base font-normal text-text-muted">days</span>
          </p>
        </div>
      )}

      {/* Project status distribution */}
      <div className="mt-8 glass-card--light p-6">
        <h2 className="text-lg font-semibold text-text font-display mb-4">
          Project Status Distribution
        </h2>
        {statusEntries.length === 0 ? (
          <p className="text-sm text-text-muted">No projects found.</p>
        ) : (
          <div className="space-y-4">
            {statusEntries.map(([status, count]) => (
              <div key={status}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-text-muted">
                    {STATUS_LABEL[status] ?? status}
                  </span>
                  <span className="text-text-muted tabular-nums">
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
        <h2 className="text-lg font-semibold text-text font-display mb-4">
          Quoted vs. Actual — Recalibration Data
        </h2>
        <p className="text-sm text-text-muted mb-4">
          Comparison of quoted delivery dates vs. actual delivery for delivered projects
          where scope did not change. High deviations indicate categories that may need
          recalibration.
        </p>

        <div className="glass-card--light overflow-hidden">
          {recalibration.length === 0 ? (
            <div className="p-8 text-center text-sm text-text-muted">
              No recalibration data available yet. Data appears once delivered projects have
              signed contracts with quote snapshots.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--glass-border)] bg-text-muted/10">
                  <th className="text-left p-4 text-xs font-medium text-text-muted uppercase tracking-wide">Project</th>
                  <th className="text-left p-4 text-xs font-medium text-text-muted uppercase tracking-wide">Product Type</th>
                  <th className="text-right p-4 text-xs font-medium text-text-muted uppercase tracking-wide">Quoted Price</th>
                  <th className="text-left p-4 text-xs font-medium text-text-muted uppercase tracking-wide">Confirmed Delivery</th>
                  <th className="text-left p-4 text-xs font-medium text-text-muted uppercase tracking-wide">Actual Delivery</th>
                  <th className="text-right p-4 text-xs font-medium text-text-muted uppercase tracking-wide">Deviation (days)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--glass-border)]">
                {recalibration.map((item) => (
                  <tr key={item.project_id} className="hover:bg-text-muted/5 motion-safe:transition-colors">
                    <td className="p-4 text-sm font-medium text-text">
                      #{item.project_id}
                    </td>
                    <td className="p-4 text-sm text-text-muted">
                      {item.product_type_name}
                    </td>
                    <td className="p-4 text-sm text-right tabular-nums text-text">
                      ${item.quoted_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-sm text-text-muted">
                      {new Date(item.confirmed_delivery_date).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-sm text-text-muted">
                      {new Date(item.actual_delivery_date).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tabular-nums ${
                          item.deviation_days > 0
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : item.deviation_days < 0
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-text-muted/20 text-text-muted'
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
