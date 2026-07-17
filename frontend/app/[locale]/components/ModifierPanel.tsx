import type { ModifierGroup } from '@/app/types/quote';

interface ModifierPanelProps {
  groups: ModifierGroup[];
  selectedModifierIds: number[];
  onToggle: (modifierId: number, groupId: number, allowsMultiple: boolean) => void;
}

function formatPriceImpact(price: string): { text: string; isPositive: boolean; isZero: boolean } {
  const num = parseFloat(price);
  if (num === 0) return { text: 'No change', isPositive: false, isZero: true };
  const formatted = `$${Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  return {
    text: num > 0 ? `+${formatted}` : `-${formatted}`,
    isPositive: num > 0,
    isZero: false,
  };
}

function formatTimeImpact(days: number): { text: string; isPositive: boolean; isZero: boolean } {
  if (days === 0) return { text: 'No change', isPositive: false, isZero: true };
  const abs = Math.abs(days);
  const dayStr = abs === 1 ? 'day' : 'days';
  return {
    text: days > 0 ? `+${abs} ${dayStr}` : `-${abs} ${dayStr}`,
    isPositive: days > 0,
    isZero: false,
  };
}

export default function ModifierPanel({ groups, selectedModifierIds, onToggle }: ModifierPanelProps) {
  if (groups.length === 0) {
    return (
      <div className="text-center py-10 text-text-muted">
        <p className="text-lg font-medium">No options available for this product type</p>
        <p className="text-sm mt-1">You can proceed to the summary with the base configuration.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => {
        const isRadioGroup = !group.allows_multiple;

        return (
          <fieldset key={group.id}>
            <legend className="text-base font-semibold text-text mb-3">
              {group.name}
              {isRadioGroup && (
                <span className="ml-2 text-xs font-normal text-text-muted">(choose one)</span>
              )}
              {group.allows_multiple && (
                <span className="ml-2 text-xs font-normal text-text-muted">(select all that apply)</span>
              )}
            </legend>
            <div className="space-y-2">
              {group.modifiers
                .filter((m) => m.active)
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((modifier) => {
                  const isSelected = selectedModifierIds.includes(modifier.id);
                  const priceImpact = formatPriceImpact(modifier.price_impact_usd);
                  const timeImpact = formatTimeImpact(modifier.time_impact_days);

                  return (
                    <label
                      key={modifier.id}
                      className={`
                        flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer
                        transition-all duration-150
                        ${isSelected
                          ? 'border-accent glass-card--light'
                          : 'border-[var(--glass-border)] hover:border-accent/30 glass-card--light'
                        }
                      `}
                    >
                      <input
                        type={isRadioGroup ? 'radio' : 'checkbox'}
                        name={isRadioGroup ? `group-${group.id}` : undefined}
                        checked={isSelected}
                        onChange={() => onToggle(modifier.id, group.id, group.allows_multiple)}
                        className={`
                          ${isRadioGroup
                            ? 'w-4 h-4 text-accent border-gray-300'
                            : 'w-4 h-4 text-accent rounded border-gray-300'
                          }
                          focus:ring-accent
                        `}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-text">
                          {modifier.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm shrink-0">
                        {!priceImpact.isZero && (
                          <span
                            className={`font-medium tabular-nums ${
                              priceImpact.isPositive ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {priceImpact.text}
                          </span>
                        )}
                        {!timeImpact.isZero && (
                          <span
                            className={`font-medium tabular-nums ${
                              timeImpact.isPositive ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {timeImpact.text}
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
