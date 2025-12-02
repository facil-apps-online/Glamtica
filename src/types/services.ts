export interface MasterServiceImage {
  id: string;
  image_url: string;
  is_primary: boolean;
}

export interface MasterService {
  id: string;
  name: string;
  description?: string;
  duration_minutes: number; // Duración del servicio en minutos
  
  is_active?: boolean;
  category_id?: string; // ID de la categoría del servicio
  tenant_id: string;
  created_at: string;
  updated_at: string;
  service_images?: MasterServiceImage[];
}

export interface BranchService extends MasterService {
  branch_service_id: string;
  branch_id: string;
  selling_price: number; // Precio de venta en esta sucursal
  is_branch_active: boolean; // Si el servicio está activo en esta sucursal
  is_visible_on_microsite: boolean; // Si el servicio es visible en el micrositio de la sucursal
}

export interface ServiceTaxType {
  id: string;
  service_id: string;
  tax_type_id: string;
  tax_types: { // Relación con la tabla tax_types
    name: string;
    rate: number | null;
    is_percentage: boolean;
  };
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface BranchCombo {
  branch_combo_id: string;
  branch_id: string;
  combo_id: string;
  name: string;
  description?: string;
  selling_price: number; // Precio de venta en esta sucursal
  is_active_in_branch: boolean; // Si el combo está activo en esta sucursal
  is_visible_on_microsite: boolean; // Si el combo es visible en el micrositio de la sucursal
  duration_minutes: number;
  items: any[]; // TODO: Define a more specific type for combo items
}
