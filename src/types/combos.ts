export interface ComboImage {
  id: string;
  combo_id: string;
  tenant_id: string;
  google_drive_file_id: string;
  image_url: string | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface MasterCombo {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  selling_price: number; // Precio base del combo
  duration_minutes?: number; // Duración total estimada
  tenant_id: string;
  // Otros campos relevantes del combo maestro
  combo_items: Array<{
    product_id?: string;
    service_id?: string;
    quantity: number;
    price: number;
    is_parallel: boolean;
    offset_minutes: number;
    // Detalles de producto/servicio anidados
    product?: { name: string; sku?: string };
    service?: { name: string; duration_minutes?: number };
  }>;
  combo_images?: ComboImage[]; // Add this line
}