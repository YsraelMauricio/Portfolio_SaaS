'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { fetchApi } from '@/app/lib/api';
import type {
  ServiceCategory,
  ProductType,
  ModifierGroup,
  QuoteCalculation,
  NextStartDateResponse,
} from '@/app/types/quote';
import { Link } from '@/i18n/navigation';
import StepIndicator from '@/app/[locale]/components/StepIndicator';
import CategoryCard from '@/app/[locale]/components/CategoryCard';
import ProductTypeCard from '@/app/[locale]/components/ProductTypeCard';
import ModifierPanel from '@/app/[locale]/components/ModifierPanel';
import PriceDisplay from '@/app/[locale]/components/PriceDisplay';

export default function QuoteWizard() {
  const t = useTranslations('QuoteWizard');
  const tc = useTranslations('Common');

  const STEPS = [
    { number: 1, label: t('stepCategory') },
    { number: 2, label: t('stepProduct') },
    { number: 3, label: t('stepModifiers') },
    { number: 4, label: t('stepSummary') },
  ];

  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [selectedProductType, setSelectedProductType] = useState<ProductType | null>(null);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [selectedModifierIds, setSelectedModifierIds] = useState<number[]>([]);
  const [calculation, setCalculation] = useState<QuoteCalculation | null>(null);
  const [nextStartDate, setNextStartDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const calculationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const result = await fetchApi<ServiceCategory[]>('/quotes/categories');
        setCategories(result.data.filter((c) => c.active !== false));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load categories');
      } finally {
        setPageLoading(false);
      }
    }
    loadCategories();
  }, []);

  // Fetch product types when category is selected
  useEffect(() => {
    const categoryId = selectedCategory?.id;
    if (!categoryId) return;

    async function loadProductTypes() {
      setLoading(true);
      setError(null);
      setSelectedProductType(null);
      setModifierGroups([]);
      setSelectedModifierIds([]);
      setCalculation(null);
      try {
        const result = await fetchApi<ProductType[]>(
          `/quotes/product-types?category_id=${categoryId}`,
        );
        setProductTypes(result.data.filter((pt) => pt.active !== false));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load product types');
      } finally {
        setLoading(false);
      }
    }
    loadProductTypes();
  }, [selectedCategory]);

  // Fetch modifiers when product type is selected
  useEffect(() => {
    const productTypeId = selectedProductType?.id;
    if (!productTypeId) return;

    async function loadModifiers() {
      setLoading(true);
      setError(null);
      setSelectedModifierIds([]);
      setCalculation(null);
      try {
        const result = await fetchApi<ModifierGroup[]>(
          `/quotes/modifiers?product_type_id=${productTypeId}`,
        );
        setModifierGroups(result.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load options');
      } finally {
        setLoading(false);
      }
    }
    loadModifiers();
  }, [selectedProductType]);

  // Calculate quote whenever modifier selection changes
  const calculateQuote = useCallback(
    async (productTypeId: number, modifierIds: number[]) => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchApi<QuoteCalculation>('/quotes/calculate', {
          method: 'POST',
          body: JSON.stringify({
            product_type_id: productTypeId,
            modifier_ids: modifierIds,
          }),
        });
        setCalculation(result.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Calculation failed');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Debounced calculation
  useEffect(() => {
    if (!selectedProductType) return;

    if (calculationTimeoutRef.current) {
      clearTimeout(calculationTimeoutRef.current);
    }

    calculationTimeoutRef.current = setTimeout(() => {
      calculateQuote(selectedProductType.id, selectedModifierIds);
    }, 200);

    return () => {
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
    };
  }, [selectedModifierIds, selectedProductType, calculateQuote]);

  // Fetch next available start date when reaching step 3 or 4
  useEffect(() => {
    if (step >= 3 && !nextStartDate) {
      fetchApi<NextStartDateResponse>('/quotes/next-available-start-date')
        .then((result) => setNextStartDate(result.data.next_available_start_date))
        .catch(() => {
          // Silently fail — this is a secondary display
        });
    }
  }, [step, nextStartDate]);

  const handleCategorySelect = (category: ServiceCategory) => {
    setSelectedCategory(category);
    setStep(2);
  };

  const handleProductTypeSelect = (productType: ProductType) => {
    setSelectedProductType(productType);
    setStep(3);
  };

  const handleModifierToggle = (
    modifierId: number,
    groupId: number,
    allowsMultiple: boolean,
  ) => {
    setSelectedModifierIds((prev) => {
      if (allowsMultiple) {
        // Checkbox behavior — toggle
        return prev.includes(modifierId)
          ? prev.filter((id) => id !== modifierId)
          : [...prev, modifierId];
      }
      // Radio behavior — replace all IDs from this group
      const group = modifierGroups.find((g) => g.id === groupId);
      if (!group) return prev;
      const groupIds = group.modifiers.map((m) => m.id);
      const withoutGroup = prev.filter((id) => !groupIds.includes(id));
      if (prev.includes(modifierId)) {
        // Deselecting the current radio — keep nothing from this group
        return withoutGroup;
      }
      return [...withoutGroup, modifierId];
    });
  };

  const handleBack = () => {
    setStep((s) => Math.max(1, s - 1));
  };

  const handleContinue = () => {
    if (step === 3 && selectedProductType) {
      // Ensure we have a calculation before going to summary
      if (!calculation) {
        calculateQuote(selectedProductType.id, selectedModifierIds);
      }
    }
    setStep((s) => Math.min(STEPS.length, s + 1));
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full motion-safe:animate-spin" />
          <p className="text-sm text-text-muted">{tc('loading')}</p>
        </div>
      </div>
    );
  }

  if (error && categories.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <div className="glass-card--light border border-red-200 dark:border-red-800 p-6">
          <p className="text-red-600 dark:text-red-400 font-medium">{tc('error')}</p>
          <p className="text-sm text-red-500 dark:text-red-300 mt-1">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Page title */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-text font-display">{t('title')}</h1>
        <p className="mt-2 text-text-muted">
          {t('subtitle')}
        </p>
      </div>

      {/* Step indicator */}
      <StepIndicator steps={STEPS} currentStep={step} />

      {/* Error banner (non-blocking) */}
      {error && categories.length > 0 && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg px-4 py-3 text-sm">
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Step 1: Choose Category */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-semibold text-text mb-6 font-display">
            {t('selectCategory')}
          </h2>
          <div className="@container">
            <div className="grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3 gap-4">
            {categories
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  isSelected={selectedCategory?.id === category.id}
                  onSelect={handleCategorySelect}
                />
              ))}
          </div>
          </div>
        </div>
      )}

      {/* Step 2: Choose Product Type */}
      {step === 2 && selectedCategory && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <button
              type="button"
              onClick={handleBack}
              className="text-sm text-text-muted hover:text-text flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {tc('back')}
            </button>
            <span className="text-sm text-text-muted/50">|</span>
            <span className="text-sm text-text-muted">
              Category: <span className="font-medium text-text">{selectedCategory.name}</span>
            </span>
          </div>
          <h2 className="text-xl font-semibold text-text mb-6 font-display">
            {t('selectProduct')}
          </h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 glass-card--light animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {productTypes
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((pt) => (
                  <ProductTypeCard
                    key={pt.id}
                    productType={pt}
                    isSelected={selectedProductType?.id === pt.id}
                    onSelect={handleProductTypeSelect}
                  />
                ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Choose Modifiers */}
      {step === 3 && selectedProductType && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <button
              type="button"
              onClick={handleBack}
              className="text-sm text-text-muted hover:text-text flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {tc('back')}
            </button>
            <span className="text-sm text-text-muted/50">|</span>
            <span className="text-sm text-text-muted">
              {selectedProductType.name}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              <h2 className="text-xl font-semibold text-text mb-6 font-display">
                {t('configureOptions')}
              </h2>
              {loading && modifierGroups.length === 0 ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 glass-card--light animate-pulse" />
                  ))}
                </div>
              ) : (
                <ModifierPanel
                  groups={modifierGroups}
                  selectedModifierIds={selectedModifierIds}
                  onToggle={handleModifierToggle}
                />
              )}
            </div>
            <div className="lg:col-span-2">
              <div className="lg:sticky lg:top-8">
                <PriceDisplay
                  calculation={calculation}
                  loading={loading}
                  error={error}
                  isFloorNotCeiling={selectedProductType.is_floor_not_ceiling}
                  nextStartDate={nextStartDate}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Summary */}
      {step === 4 && selectedProductType && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <button
              type="button"
              onClick={handleBack}
              className="text-sm text-text-muted hover:text-text flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          </div>

          <h2 className="text-xl font-semibold text-text mb-6 font-display">{t('reviewSummary')}</h2>

          <div className="glass-card--light divide-y divide-[var(--glass-border)]">
            {/* Category */}
            <div className="p-5 flex items-center justify-between">
              <span className="text-sm text-text-muted">Category</span>
              <span className="text-sm font-medium text-text">
                {selectedCategory?.name}
              </span>
            </div>

            {/* Product Type */}
            <div className="p-5 flex items-center justify-between">
              <span className="text-sm text-text-muted">Product Type</span>
              <span className="text-sm font-medium text-text">
                {selectedProductType.name}
              </span>
            </div>

            {/* Selected modifiers */}
            <div className="p-5">
              <span className="text-sm text-text-muted block mb-2">Selected Options</span>
              {selectedModifierIds.length === 0 ? (
                <span className="text-sm text-text-muted">None selected (base configuration)</span>
              ) : (
                <ul className="space-y-1">
                  {modifierGroups
                    .flatMap((g) => g.modifiers)
                    .filter((m) => selectedModifierIds.includes(m.id))
                    .map((m) => {
                      const price = parseFloat(m.price_impact_usd);
                      return (
                        <li key={m.id} className="flex items-center justify-between text-sm">
                          <span className="text-text">{m.name}</span>
                          {price !== 0 && (
                            <span className={`font-medium tabular-nums ${price > 0 ? 'text-secondary' : 'text-red-600'}`}>
                              {price > 0 ? '+' : ''}${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                          )}
                        </li>
                      );
                    })}
                </ul>
              )}
            </div>

            {/* Price & Timeline */}
            <div className="p-5">
              {calculation ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-text-muted font-medium mb-1 font-mono uppercase tracking-wider">Estimated Price</p>
                    <p className="text-xl font-bold text-text tabular-nums font-mono">
                      ${calculation.estimated_price_min.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      <span className="text-text-muted mx-1">–</span>
                      ${calculation.estimated_price_max.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">+15% buffer included</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted font-medium mb-1 font-mono uppercase tracking-wider">Timeline</p>
                    <p className="text-xl font-bold text-text tabular-nums font-mono">
                      {calculation.estimated_days_min}
                      {calculation.estimated_days_max !== calculation.estimated_days_min && (
                        <>
                          <span className="text-text-muted mx-1">–</span>
                          {calculation.estimated_days_max}
                        </>
                      )}
                      <span className="text-base font-normal text-text-muted ml-1">
                        {calculation.estimated_days_max === 1 ? 'day' : 'days'}
                      </span>
                    </p>
                    {selectedProductType.is_floor_not_ceiling && (
                      <p className="text-xs text-accent mt-0.5">Minimum estimate</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-text-muted">Calculating...</div>
              )}
            </div>
          </div>

          {nextStartDate && (
            <div className="mt-4 glass-card--light border border-accent/20 p-4 flex items-center gap-3">
              <svg className="w-5 h-5 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="text-xs text-accent font-medium">Next available start date</p>
                <p className="text-sm text-text">{nextStartDate}</p>
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-8 text-center">
            <p className="text-sm text-text-muted mb-4">
              Log in to save your quote and compare different configurations
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-[#1E1B2E] font-medium rounded-lg hover:brightness-110 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Log in to Save Quote
            </Link>
          </div>
        </div>
      )}

      {/* Navigation buttons (for steps 1-3) */}
      {step < 4 && step > 1 && (
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="px-5 py-2.5 text-sm font-medium text-text-muted glass-card--light hover:border-accent/30 transition-all"
          >
            Back
          </button>
          {step === 3 && (
            <button
              type="button"
              onClick={handleContinue}
              className="px-5 py-2.5 text-sm font-medium bg-accent text-[#1E1B2E] rounded-lg hover:brightness-110 transition-all"
            >
              View Summary
            </button>
          )}
        </div>
      )}

      {/* Step 1: Continue hint */}
      {step === 1 && (
        <p className="mt-6 text-center text-sm text-text-muted">
          Select a category to get started
        </p>
      )}
    </div>
  );
}
