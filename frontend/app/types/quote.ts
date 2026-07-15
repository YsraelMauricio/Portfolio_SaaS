export interface ServiceCategory {
  id: number;
  name: string;
  slug: string;
  bolivia_only: boolean;
  sort_order: number;
  active?: boolean;
  product_types_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProductType {
  id: number;
  service_category_id: number;
  name: string;
  slug: string;
  base_price_usd: string;
  base_days_min: number;
  base_days_max: number;
  is_floor_not_ceiling: boolean;
  sort_order: number;
  active?: boolean;
  description?: string;
  category?: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface Modifier {
  id: number;
  modifier_group_id: number;
  name: string;
  price_impact_usd: string;
  time_impact_days: number;
  impact_type: 'additive' | 'multiplier';
  sort_order: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ModifierGroup {
  id: number;
  product_type_id: number | null;
  name: string;
  allows_multiple: boolean;
  sort_order: number;
  modifiers: Modifier[];
  created_at?: string;
  updated_at?: string;
}

export interface QuoteCalculation {
  estimated_price_min: number;
  estimated_price_max: number;
  estimated_days_min: number;
  estimated_days_max: number;
}

export interface NextStartDateResponse {
  next_available_start_date: string;
}
