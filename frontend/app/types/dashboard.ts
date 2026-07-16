// ─── User ──────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

// ─── Project ────────────────────────────────────────────────────────────────────

export type ProjectStatus =
  | 'submitted'
  | 'in_development'
  | 'delivered'
  | 'cancelled';

export interface ProjectMilestone {
  id: number;
  project_id: number;
  name: string;
  estimated_date: string;
  completed_date: string | null;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface Project {
  id: number;
  quote_id: number | null;
  user_id: number;
  status: ProjectStatus;
  actual_start_date: string | null;
  confirmed_delivery_date: string | null;
  actual_delivery_date: string | null;
  paused_days: number;
  scope_changed: boolean;
  is_test: boolean;
  created_at?: string;
  updated_at?: string;
  user?: Pick<User, 'id' | 'name' | 'email'>;
  milestones?: ProjectMilestone[];
}

// ─── Quote ──────────────────────────────────────────────────────────────────────

export interface SavedQuote {
  id: number;
  user_id: number;
  product_type_id: number;
  estimated_price_min: string;
  estimated_price_max: string;
  estimated_days_min: number;
  estimated_days_max: number;
  currency: string;
  status: string;
  is_test: boolean;
  locale: string | null;
  created_at?: string;
  updated_at?: string;
  product_type?: {
    id: number;
    name: string;
    slug: string;
    service_category_id: number;
  };
  modifiers?: Array<{
    id: number;
    name: string;
    price_impact_usd: string;
    time_impact_days: number;
    impact_type: string;
  }>;
}

// ─── Contract ───────────────────────────────────────────────────────────────────

export type ContractStatus =
  | 'draft'
  | 'approved_pending_send'
  | 'sent'
  | 'signed'
  | 'cancelled';

export interface QuoteSnapshot {
  product_type_name: string;
  price_usd: number;
  estimated_days_min: number;
  estimated_days_max: number;
  modifiers: string[];
  technologies: string[];
}

export interface Contract {
  id: number;
  project_id: number;
  quote_snapshot: QuoteSnapshot;
  status: ContractStatus;
  documenso_document_id: string | null;
  generated_at: string | null;
  approved_by_admin_at: string | null;
  sent_at: string | null;
  signed_at: string | null;
  cancelled_at: string | null;
  is_test: boolean;
  created_at: string;
  updated_at: string;
  pdf_url?: string;
  project?: Pick<Project, 'id' | 'user_id'>;
}

// ─── Payment ────────────────────────────────────────────────────────────────────

export type PaymentMethod = 'qr_bcb' | 'binance_pay' | 'paypal' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'confirmed' | 'rejected' | 'refunded';

export interface Payment {
  id: number;
  project_id: number;
  contract_id: number;
  amount_usd: string;
  method: PaymentMethod;
  local_currency: string | null;
  amount_local: string | null;
  exchange_rate_used: string | null;
  exchange_rate_overridden_by_admin_id: number | null;
  provider_transaction_id: string | null;
  webhook_signature_verified: boolean | null;
  status: PaymentStatus;
  proof_media_id: number | null;
  confirmed_by_admin_id: number | null;
  paid_at: string | null;
  is_test: boolean;
  created_at?: string;
  updated_at?: string;
}

// ─── Dashboard Metrics ──────────────────────────────────────────────────────────

export interface DashboardMetrics {
  projects_by_status: Record<string, number>;
  total_revenue: number;
  pending_contracts: number;
  new_leads_this_month: number;
  average_delivery_days: number | null;
}

// ─── Recalibration ──────────────────────────────────────────────────────────────

export interface RecalibrationItem {
  project_id: number;
  product_type_name: string;
  quoted_price: number;
  confirmed_delivery_date: string;
  actual_delivery_date: string;
  deviation_days: number;
}

// ─── Profile Links ──────────────────────────────────────────────────────────────

export interface ProfileLink {
  id: number;
  key: string;
  url: string;
  visible: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

// ─── CV ─────────────────────────────────────────────────────────────────────────

export interface CvMetadata {
  file_name: string;
  updated_at: string;
  size_bytes: number;
}

export interface CvUploadResponse {
  id: number;
  file_name: string;
  size_bytes: number;
  mime_type: string;
  updated_at: string;
}

// ─── Settings ───────────────────────────────────────────────────────────────────

export interface Settings {
  [key: string]: string;
}

export interface PublicSettings {
  contact_email?: string;
  contact_phone?: string;
  next_available_start_date?: string;
}

// ─── Deleted User ───────────────────────────────────────────────────────────────

export interface DeletedUser {
  id: number;
  name: string;
  email: string;
  deleted_at: string;
  exit_survey_reason: string | null;
  created_at: string;
}

// ─── API wrappers ───────────────────────────────────────────────────────────────

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// ─── Payment Initiation ─────────────────────────────────────────────────────────

export interface PaymentInitiationResponse {
  payment: Payment;
  provider_data: Record<string, unknown>;
}
