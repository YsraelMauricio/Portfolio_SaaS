'use client';

import { useEffect, useState } from 'react';
import { fetchApiWithAuth } from '@/app/lib/api';
import type { SavedQuote } from '@/app/types/dashboard';

export default function MyQuotesPage() {
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<number[]>([]);

  useEffect(() => {
    fetchApiWithAuth<SavedQuote[]>('/quotes/mine')
      .then((res) => setQuotes(res.data))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load quotes'))
      .finally(() => setLoading(false));
  }, []);

  const toggleCompare = (id: number) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const comparedQuotes = quotes.filter((q) => compareIds.includes(q.id));

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

  return (
    <div>
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-[#FAFAFA]">My Quotes</h1>
      <p className="mt-2 text-zinc-500 dark:text-[rgba(250,250,250,0.6)]">
        Review and compare your saved quotes. Select quotes to compare them side by side.
      </p>

      {/* Compare section */}
      {compareIds.length >= 2 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-[#FAFAFA] mb-4">
            Comparing {compareIds.length} Quotes
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="text-left p-4 text-sm font-medium text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">
                    Feature
                  </th>
                  {comparedQuotes.map((q) => (
                    <th key={q.id} className="text-left p-4 text-sm font-medium text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">
                      {q.product_type?.name ?? `Quote #${q.id}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                <tr>
                  <td className="p-4 text-sm text-zinc-600 dark:text-zinc-400">Category</td>
                  {comparedQuotes.map((q) => (
                    <td key={q.id} className="p-4 text-sm font-medium text-zinc-900 dark:text-[#FAFAFA]">
                      {q.product_type?.name ?? '—'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 text-sm text-zinc-600 dark:text-zinc-400">Price Range</td>
                  {comparedQuotes.map((q) => (
                    <td key={q.id} className="p-4 text-sm font-medium tabular-nums text-zinc-900 dark:text-[#FAFAFA]">
                      ${parseFloat(q.estimated_price_min).toLocaleString('en-US')}
                      {' – '}
                      ${parseFloat(q.estimated_price_max).toLocaleString('en-US')}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 text-sm text-zinc-600 dark:text-zinc-400">Timeline</td>
                  {comparedQuotes.map((q) => (
                    <td key={q.id} className="p-4 text-sm font-medium text-zinc-900 dark:text-[#FAFAFA]">
                      {q.estimated_days_min}
                      {q.estimated_days_max !== q.estimated_days_min
                        ? ` – ${q.estimated_days_max}`
                        : ''}{' '}
                      days
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 text-sm text-zinc-600 dark:text-zinc-400">Status</td>
                  {comparedQuotes.map((q) => (
                    <td key={q.id} className="p-4 text-sm capitalize text-zinc-900 dark:text-[#FAFAFA]">
                      {q.status.replace(/_/g, ' ')}
                    </td>
                  ))}
                </tr>
                {comparedQuotes.some((q) => q.modifiers && q.modifiers.length > 0) && (
                  <tr>
                    <td className="p-4 text-sm text-zinc-600 dark:text-zinc-400">Modifiers</td>
                    {comparedQuotes.map((q) => (
                      <td key={q.id} className="p-4 text-sm text-zinc-900 dark:text-[#FAFAFA]">
                        {q.modifiers && q.modifiers.length > 0
                          ? q.modifiers.map((m) => m.name).join(', ')
                          : 'None'}
                      </td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={() => setCompareIds([])}
            className="mt-4 text-sm text-[#6D28D9] hover:underline"
          >
            Clear comparison
          </button>
        </div>
      )}

      {/* Quote list */}
      {quotes.length === 0 ? (
        <div className="mt-8 text-center py-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
          <p className="text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">
            No saved quotes yet.
          </p>
          <a
            href="/cotizar"
            className="mt-3 inline-block px-6 py-2.5 bg-[#6D28D9] text-white font-medium rounded-lg hover:bg-[#5B21B6] transition-colors text-sm"
          >
            Get a Quote
          </a>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {quotes.map((quote) => (
            <div
              key={quote.id}
              className={`bg-white dark:bg-zinc-900 border rounded-xl p-5 transition-colors ${
                compareIds.includes(quote.id)
                  ? 'border-[#6D28D9] dark:border-[#6D28D9] ring-1 ring-[#6D28D9]/20'
                  : 'border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={compareIds.includes(quote.id)}
                    onChange={() => toggleCompare(quote.id)}
                    className="mt-1 rounded border-zinc-300 dark:border-zinc-600 text-[#6D28D9] focus:ring-[#6D28D9]"
                    aria-label={`Select quote ${quote.id} for comparison`}
                  />
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-[#FAFAFA]">
                      {quote.product_type?.name ?? `Quote #${quote.id}`}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-[rgba(250,250,250,0.55)] mt-0.5">
                      Created {new Date(quote.created_at ?? '').toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[#6D28D9] dark:text-[#6D28D9] tabular-nums">
                    ${parseFloat(quote.estimated_price_min).toLocaleString('en-US')}
                    <span className="text-zinc-300 dark:text-zinc-600 mx-1">–</span>
                    ${parseFloat(quote.estimated_price_max).toLocaleString('en-US')}
                  </p>
                  <span className="inline-block text-xs text-zinc-500 dark:text-[rgba(250,250,250,0.55)] capitalize">
                    {quote.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Modifier tags */}
              {quote.modifiers && quote.modifiers.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {quote.modifiers.map((mod) => (
                    <span
                      key={mod.id}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    >
                      {mod.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Timeline */}
              <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                Timeline: {quote.estimated_days_min}
                {quote.estimated_days_max !== quote.estimated_days_min
                  ? ` – ${quote.estimated_days_max}`
                  : ''}{' '}
                days
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
