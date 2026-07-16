'use client';

import { useState } from 'react';
import { fetchApiWithAuth } from '@/app/lib/api';

const METHOD_LABEL: Record<string, string> = {
  qr_bcb: 'QR BCB',
  binance_pay: 'Binance Pay',
  paypal: 'PayPal',
  bank_transfer: 'Bank Transfer',
};

export default function AdminPaymentsPage() {
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState('');
  const [exchangeRateOverride, setExchangeRateOverride] = useState('');

  const handleConfirmPayment = async () => {
    const id = Number(paymentId);
    if (!id) {
      setActionError('Please enter a valid payment ID');
      return;
    }

    setActionLoading(true);
    setActionError(null);
    setSuccess(null);
    try {
      const body: Record<string, unknown> = {};
      if (exchangeRateOverride.trim()) {
        body.exchange_rate_override = parseFloat(exchangeRateOverride);
      }
      await fetchApiWithAuth(`/admin/payments/${id}/confirm`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      setSuccess(`Payment #${id} confirmed successfully.`);
      setPaymentId('');
      setExchangeRateOverride('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to confirm payment');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-[#FAFAFA]">Payments</h1>
      <p className="mt-2 text-zinc-500 dark:text-[rgba(250,250,250,0.6)]">
        Manage payments and confirm bank transfers.
      </p>

      {actionError && (
        <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {actionError}
        </div>
      )}

      {success && (
        <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3 text-sm text-green-600 dark:text-green-400">
          {success}
        </div>
      )}

      {/* Manual confirmation form */}
      <div className="mt-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-[#FAFAFA] mb-4">
          Confirm a Bank Transfer Payment
        </h2>
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Payment ID
            </label>
            <input
              type="number"
              placeholder="Enter payment ID"
              value={paymentId}
              onChange={(e) => setPaymentId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-[#FAFAFA] focus:ring-2 focus:ring-[#6D28D9] focus:border-transparent"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Exchange Rate Override (optional)
            </label>
            <input
              type="number"
              step="0.0001"
              placeholder="e.g., 6.96"
              value={exchangeRateOverride}
              onChange={(e) => setExchangeRateOverride(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-[#FAFAFA] focus:ring-2 focus:ring-[#6D28D9] focus:border-transparent"
            />
          </div>
          <button
            type="button"
            onClick={handleConfirmPayment}
            disabled={actionLoading}
            className="px-5 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {actionLoading ? 'Confirming...' : 'Confirm'}
          </button>
        </div>
      </div>

      {/* Payment methods info */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-[#FAFAFA] mb-4">
          Payment Methods
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(METHOD_LABEL).map(([key, label]) => (
            <div
              key={key}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5"
            >
              <p className="text-sm font-semibold text-zinc-900 dark:text-[#FAFAFA]">{label}</p>
              <p className="text-xs text-zinc-500 dark:text-[rgba(250,250,250,0.55)] mt-1">
                {key === 'bank_transfer' ? 'Manual confirmation' : 'Automatic via webhook'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
