import type { ProductType } from '@/app/types/quote';

interface ProductTypeCardProps {
  productType: ProductType;
  isSelected: boolean;
  onSelect: (productType: ProductType) => void;
}

function formatPrice(price: string): string {
  const num = parseFloat(price);
  if (num >= 1000) {
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function ProductTypeCard({ productType, isSelected, onSelect }: ProductTypeCardProps) {
  const basePrice = formatPrice(productType.base_price_usd);
  const isFixedPrice = productType.base_days_min === productType.base_days_max;
  const isSaaS = productType.slug === 'saas';

  return (
    <button
      type="button"
      onClick={() => onSelect(productType)}
      className={`
        relative flex flex-col p-6 rounded-xl border-2 text-left
        transition-all duration-200 w-full
        ${isSelected
          ? 'border-blue-600 bg-blue-50 shadow-md ring-2 ring-blue-200'
          : 'border-gray-200 bg-white hover:border-blue-400 hover:shadow-sm'
        }
      `}
      aria-pressed={isSelected}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900">{productType.name}</h3>
          {productType.description && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{productType.description}</p>
          )}
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className="text-lg font-bold text-gray-900">{basePrice}</span>
          <span className="text-xs text-gray-500">base price</span>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-gray-600">
            {isFixedPrice
              ? `${productType.base_days_min} day${productType.base_days_min !== 1 ? 's' : ''}`
              : `${productType.base_days_min}–${productType.base_days_max} days`
            }
            {isSaaS && (
              <span className="text-xs text-blue-600 ml-1">From</span>
            )}
            {productType.is_floor_not_ceiling && !isSaaS && (
              <span className="text-xs text-gray-500 ml-1">(minimum)</span>
            )}
          </span>
        </div>
      </div>
    </button>
  );
}
