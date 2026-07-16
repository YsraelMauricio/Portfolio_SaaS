'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApiWithAuth } from '@/app/lib/api';
import type { Project, SavedQuote } from '@/app/types/dashboard';

export default function DashboardHome() {
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
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
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
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-[#FAFAFA]">Dashboard</h1>
      <p className="mt-2 text-zinc-500 dark:text-[rgba(250,250,250,0.6)]">
        Welcome back! Here is an overview of your account.
      </p>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <p className="text-sm font-medium text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">Active Projects</p>
          <p className="text-3xl font-bold text-zinc-900 dark:text-[#FAFAFA] mt-2">{activeProjects.length}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <p className="text-sm font-medium text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">Delivered Projects</p>
          <p className="text-3xl font-bold text-zinc-900 dark:text-[#FAFAFA] mt-2">{deliveredProjects.length}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <p className="text-sm font-medium text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">Saved Quotes</p>
          <p className="text-3xl font-bold text-zinc-900 dark:text-[#FAFAFA] mt-2">{recentQuotes.length}</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/dashboard/projects"
          className="flex items-center justify-between p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-[#6D28D9]/30 transition-colors group"
        >
          <div>
            <p className="font-semibold text-zinc-900 dark:text-[#FAFAFA]">View Projects</p>
            <p className="text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.55)] mt-1">
              Track your project progress and milestones
            </p>
          </div>
          <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
        </Link>
        <Link
          href="/dashboard/quotes"
          className="flex items-center justify-between p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-[#6D28D9]/30 transition-colors group"
        >
          <div>
            <p className="font-semibold text-zinc-900 dark:text-[#FAFAFA]">Saved Quotes</p>
            <p className="text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.55)] mt-1">
              Review and compare your saved quotes
            </p>
          </div>
          <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>

      {/* Recent quotes */}
      {recentQuotes.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-[#FAFAFA] mb-4">
            Recent Quotes
          </h2>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl divide-y divide-zinc-100 dark:divide-zinc-800">
            {recentQuotes.map((quote) => (
              <div key={quote.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-[#FAFAFA]">
                    {quote.product_type?.name ?? `Quote #${quote.id}`}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">
                    {new Date(quote.created_at ?? '').toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#6D28D9] dark:text-[#6D28D9]">
                    ${parseFloat(quote.estimated_price_min).toLocaleString('en-US')}
                    {' – '}
                    ${parseFloat(quote.estimated_price_max).toLocaleString('en-US')}
                  </p>
                  <span className="inline-block text-xs text-zinc-500 dark:text-[rgba(250,250,250,0.55)] capitalize">
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
