
export interface MasterProduct {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  price: number | null;
  is_active: boolean;
  tenant_id: string;
}

export interface BranchProduct {
  id: string; // Master product ID
  branch_product_id: string; // The ID of the relationship table row
  name: string;
  description: string | null;
  sku: string | null;
  selling_price: number;
  stock_quantity: number;
  is_branch_active: boolean;
}
