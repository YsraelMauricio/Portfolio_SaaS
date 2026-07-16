import type { QuoteCalculation } from '@/app/types/quote';

interface PriceDisplayProps {
  calculation: QuoteCalculation | null;
  loading: boolean;
  error: string | null;
  isFloorNotCeiling: boolean;
  nextStartDate: string;
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export default function PriceDisplay({
  calculation,
  loading,
  error,
  isFloorNotCeiling,
  nextStartDate,
}: PriceDisplayProps) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-blue-800 uppercase tracking-wide mb-4">
        Estimated Price & Timeline
      </h3>

      {loading && (
        <div className="flex items-center gap-3 py-4">
          <div className="animate-pulse flex gap-4 w-full">
            <div className="h-10 bg-blue-200 rounded-lg flex-1" />
            <div className="h-10 bg-blue-200 rounded-lg flex-1" />
          </div>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {!loading && !error && calculation && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Price Range</p>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">
              {formatCurrency(calculation.estimated_price_min)}
              <span className="text-gray-400 text-lg mx-1">–</span>
              {formatCurrency(calculation.estimated_price_max)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              +15% buffer included in maximum
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Timeline</p>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">
              {calculation.estimated_days_min}
              {calculation.estimated_days_max !== calculation.estimated_days_min && (
                <>
                  <span className="text-gray-400 text-lg mx-1">–</span>
                  {calculation.estimated_days_max}
                </>
              )}
              <span className="text-base font-normal text-gray-500 ml-1.5">
                {calculation.estimated_days_max === 1 ? 'day' : 'days'}
              </span>
            </p>
            {isFloorNotCeiling && (
              <p className="text-xs text-blue-600 mt-1 font-medium">
                This is a minimum estimate — actual time may vary based on scope
              </p>
            )}
          </div>
        </div>
      )}

      {!loading && !error && !calculation && (
        <div className="text-sm text-gray-400 py-4 text-center">
          Select modifiers to see the estimated price and timeline
        </div>
      )}

      {nextStartDate && (
        <div className="mt-4 pt-4 border-t border-blue-200">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <p className="text-xs text-gray-500 font-medium">Next available start date</p>
              <p className="text-sm text-gray-800">{nextStartDate}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
