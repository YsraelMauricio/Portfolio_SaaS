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
    <div className="glass-card--light p-6">
      <h3 className="text-sm font-semibold text-primary uppercase tracking-wide mb-4 font-display">
        Estimated Price & Timeline
      </h3>

      {loading && (
        <div className="flex items-center gap-3 py-4">
          <div className="animate-pulse flex gap-4 w-full">
            <div className="h-10 bg-primary/20 rounded-lg flex-1" />
            <div className="h-10 bg-accent/20 rounded-lg flex-1" />
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
            <p className="text-xs text-text-muted font-medium mb-1 font-mono uppercase tracking-wider">Price Range</p>
            <p className="text-2xl font-bold text-text tabular-nums font-mono">
              {formatCurrency(calculation.estimated_price_min)}
              <span className="text-text-muted text-lg mx-1">–</span>
              {formatCurrency(calculation.estimated_price_max)}
            </p>
            <p className="text-xs text-text-muted mt-1">
              +15% buffer included in maximum
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted font-medium mb-1 font-mono uppercase tracking-wider">Timeline</p>
            <p className="text-2xl font-bold text-text tabular-nums font-mono">
              {calculation.estimated_days_min}
              {calculation.estimated_days_max !== calculation.estimated_days_min && (
                <>
                  <span className="text-text-muted text-lg mx-1">–</span>
                  {calculation.estimated_days_max}
                </>
              )}
              <span className="text-base font-normal text-text-muted ml-1.5 font-body">
                {calculation.estimated_days_max === 1 ? 'day' : 'days'}
              </span>
            </p>
            {isFloorNotCeiling && (
              <p className="text-xs text-accent mt-1 font-medium">
                This is a minimum estimate — actual time may vary based on scope
              </p>
            )}
          </div>
        </div>
      )}

      {!loading && !error && !calculation && (
        <div className="text-sm text-text-muted py-4 text-center">
          Select modifiers to see the estimated price and timeline
        </div>
      )}

      {nextStartDate && (
        <div className="mt-4 pt-4 border-t border-[var(--glass-border)]">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-primary mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <p className="text-xs text-text-muted font-medium">Next available start date</p>
              <p className="text-sm text-text">{nextStartDate}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
