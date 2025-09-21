export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  billing_frequency_months: number;
  display_order: number;
}

export interface PlanPricing {
  plan_id: string;
  country_id: string;
  price: number;
  currency_code: string; // e.g., "USD", "COP"
  currency_symbol: string; // e.g., "$", "COP$"
  billing_frequency_months: number; // Redundant but useful for display
  plan_name: string; // Redundant but useful for display
  plan_description: string; // Redundant but useful for display
}

export interface PublicSubscriptionPlan {
  plan_id: string;
  plan_name: string;
  plan_description: string;
  plan_features: string[];
  billing_frequency_months: number;
  price_id: string;
  calculated_price: number;
  calculated_extra_branch_price: number;
  calculated_promotional_price: number;
  currency_code: string;
  currency_symbol: string;
  base_price: number;
  active_branches_count: number;
  included_einvoices: number;
  extra_einvoice_price: number;
  extra_branch_bonus_einvoices: number;
}