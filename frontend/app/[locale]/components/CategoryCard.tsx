import type { ServiceCategory } from '@/app/types/quote';

interface CategoryCardProps {
  category: ServiceCategory;
  isSelected: boolean;
  onSelect: (category: ServiceCategory) => void;
}

export default function CategoryCard({ category, isSelected, onSelect }: CategoryCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(category)}
      className={`
        relative flex flex-col p-6 rounded-xl border-2 text-left
        transition-all duration-200
        ${isSelected
          ? 'border-accent glass-card--light shadow-md'
          : 'border-[var(--glass-border)] hover:border-accent/50 hover:shadow-sm glass-card--light'
        }
      `}
      aria-pressed={isSelected}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-text">{category.name}</h3>
        {category.product_types_count !== undefined && (
          <span className="text-xs text-text-muted bg-[var(--surface-rgb)] rounded-full px-2.5 py-0.5 font-medium">
            {category.product_types_count} product{category.product_types_count !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      {category.bolivia_only && (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5 self-start mt-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          Only available in Bolivia
        </span>
      )}
    </button>
  );
}
