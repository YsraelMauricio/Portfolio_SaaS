'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchApiWithAuth } from '@/app/lib/api';
import type { Contract } from '@/app/types/dashboard';

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300',
  approved_pending_send: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  signed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  approved_pending_send: 'Pending Send',
  sent: 'Sent',
  signed: 'Signed',
  cancelled: 'Cancelled',
};

export default function ClientContractViewPage() {
  const params = useParams();
  const contractId = params.id as string;
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApiWithAuth<Contract>(`/contracts/${contractId}`)
      .then((res) => setContract(res.data))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load contract'))
      .finally(() => setLoading(false));
  }, [contractId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <p className="text-red-600 dark:text-red-400 font-medium">
          {error ?? 'Contract not found'}
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

  const snapshot = contract.quote_snapshot;

  return (
    <div>
      <Link
        href="/dashboard/projects"
        className="text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.55)] hover:text-[#6D28D9] transition-colors"
      >
        ← Back to Projects
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-[#FAFAFA]">
          Contract #{contract.id}
        </h1>
        <span
          className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium ${STATUS_BADGE[contract.status] ?? ''}`}
        >
          {STATUS_LABEL[contract.status] ?? contract.status}
        </span>
      </div>

      {/* Contract timeline */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-center">
          <p className="text-xs text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">Generated</p>
          <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-[#FAFAFA]">
            {contract.generated_at
              ? new Date(contract.generated_at).toLocaleDateString()
              : '—'}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-center">
          <p className="text-xs text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">Approved</p>
          <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-[#FAFAFA]">
            {contract.approved_by_admin_at
              ? new Date(contract.approved_by_admin_at).toLocaleDateString()
              : '—'}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-center">
          <p className="text-xs text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">Sent</p>
          <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-[#FAFAFA]">
            {contract.sent_at
              ? new Date(contract.sent_at).toLocaleDateString()
              : '—'}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-center">
          <p className="text-xs text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">Signed</p>
          <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-[#FAFAFA]">
            {contract.signed_at
              ? new Date(contract.signed_at).toLocaleDateString()
              : '—'}
          </p>
        </div>
      </div>

      {/* Quote Snapshot */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-[#FAFAFA] mb-4">
          Quote Details
        </h2>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl divide-y divide-zinc-100 dark:divide-zinc-800">
          <div className="p-5 flex items-center justify-between">
            <span className="text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">Product Type</span>
            <span className="text-sm font-medium text-zinc-900 dark:text-[#FAFAFA]">
              {snapshot.product_type_name}
            </span>
          </div>
          <div className="p-5 flex items-center justify-between">
            <span className="text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">Price (USD)</span>
            <span className="text-sm font-bold text-zinc-900 dark:text-[#FAFAFA] tabular-nums">
              ${snapshot.price_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="p-5 flex items-center justify-between">
            <span className="text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">Estimated Timeline</span>
            <span className="text-sm font-medium text-zinc-900 dark:text-[#FAFAFA]">
              {snapshot.estimated_days_min}
              {snapshot.estimated_days_max !== snapshot.estimated_days_min
                ? ` – ${snapshot.estimated_days_max}`
                : ''}{' '}
              days
            </span>
          </div>
          {snapshot.modifiers.length > 0 && (
            <div className="p-5">
              <span className="text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">Modifiers</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {snapshot.modifiers.map((mod, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {mod}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PDF download */}
      {contract.pdf_url && (
        <div className="mt-6">
          <a
            href={contract.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6D28D9] text-white font-medium rounded-lg hover:bg-[#5B21B6] transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Signed PDF
          </a>
        </div>
      )}
    </div>
  );
}
