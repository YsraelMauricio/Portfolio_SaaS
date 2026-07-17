'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
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
      <h1 className="text-3xl font-bold text-text font-display">My Quotes</h1>
      <p className="mt-2 text-text-muted">
        Review and compare your saved quotes. Select quotes to compare them side by side.
      </p>

      {/* Compare section */}
      {compareIds.length >= 2 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-text mb-4">
            Comparing {compareIds.length} Quotes
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full glass-card--light">
              <thead>
                <tr className="border-b border-[var(--glass-border)]">
                  <th className="text-left p-4 text-sm font-medium text-text-muted">
                    Feature
                  </th>
                  {comparedQuotes.map((q) => (
                    <th key={q.id} className="text-left p-4 text-sm font-medium text-text-muted">
                      {q.product_type?.name ?? `Quote #${q.id}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--glass-border)]">
                <tr>
                  <td className="p-4 text-sm text-text-muted">Category</td>
                  {comparedQuotes.map((q) => (
                    <td key={q.id} className="p-4 text-sm font-medium text-text">
                      {q.product_type?.name ?? '—'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 text-sm text-text-muted">Price Range</td>
                  {comparedQuotes.map((q) => (
                    <td key={q.id} className="p-4 text-sm font-medium tabular-nums text-text">
                      ${parseFloat(q.estimated_price_min).toLocaleString('en-US')}
                      {' – '}
                      ${parseFloat(q.estimated_price_max).toLocaleString('en-US')}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 text-sm text-text-muted">Timeline</td>
                  {comparedQuotes.map((q) => (
                    <td key={q.id} className="p-4 text-sm font-medium text-text">
                      {q.estimated_days_min}
                      {q.estimated_days_max !== q.estimated_days_min
                        ? ` – ${q.estimated_days_max}`
                        : ''}{' '}
                      days
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 text-sm text-text-muted">Status</td>
                  {comparedQuotes.map((q) => (
                    <td key={q.id} className="p-4 text-sm capitalize text-text">
                      {q.status.replace(/_/g, ' ')}
                    </td>
                  ))}
                </tr>
                {comparedQuotes.some((q) => q.modifiers && q.modifiers.length > 0) && (
                  <tr>
                    <td className="p-4 text-sm text-text-muted">Modifiers</td>
                    {comparedQuotes.map((q) => (
                      <td key={q.id} className="p-4 text-sm text-text">
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
            className="mt-4 text-sm text-primary hover:underline"
          >
            Clear comparison
          </button>
        </div>
      )}

      {/* Quote list */}
      {quotes.length === 0 ? (
        <div className="mt-8 text-center py-16 glass-card--light">
          <p className="text-text-muted">
            No saved quotes yet.
          </p>
          <Link
            href="/cotizar"
            className="mt-3 inline-block px-6 py-2.5 bg-accent text-[#1E1B2E] font-medium rounded-lg hover:brightness-110 transition-all text-sm"
          >
            Get a Quote
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {quotes.map((quote) => (
            <div
              key={quote.id}
              className={`glass-card--light p-5 transition-all ${
                compareIds.includes(quote.id)
                  ? 'border-accent ring-1 ring-accent/20'
                  : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={compareIds.includes(quote.id)}
                    onChange={() => toggleCompare(quote.id)}
                    className="mt-1 rounded border-zinc-300 dark:border-zinc-600 text-accent focus:ring-accent"
                    aria-label={`Select quote ${quote.id} for comparison`}
                  />
                  <div>
                    <h3 className="font-semibold text-text">
                      {quote.product_type?.name ?? `Quote #${quote.id}`}
                    </h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      Created {new Date(quote.created_at ?? '').toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary tabular-nums">
                    ${parseFloat(quote.estimated_price_min).toLocaleString('en-US')}
                    <span className="text-text-muted mx-1">–</span>
                    ${parseFloat(quote.estimated_price_max).toLocaleString('en-US')}
                  </p>
                  <span className="inline-block text-xs text-text-muted capitalize">
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
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--surface-rgb)] text-text-muted"
                    >
                      {mod.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Timeline */}
              <p className="mt-2 text-xs text-text-muted">
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
