import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface SupplierProduct {
  id: string;
  tenant_id: string;
  supplier_id: string;
  product_id: string;
  supplier_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  products: { // Joined product data
    name: string;
    description: string;
    price: number;
    cost_price: number;
    stock_quantity: number;
    min_stock: number;
    is_active: boolean;
  };
  suppliers: { // Joined supplier data
    name: string;
    identification_number: string;
  };
}

interface AddSupplierProductData {
  supplier_id: string;
  product_id: string;
  supplier_price: number;
}

interface UpdateSupplierProductData {
  id: string;
  supplier_price?: number;
  is_active?: boolean;
}

// Hook genérico para invocar acciones de la Edge Function
const useTenantAction = <T, P>(action: string) => {
  const { session } = useAuth();

  return async (payload: P): Promise<T> => {
    if (!session) throw new Error("No hay sesión activa.");

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action, payload }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || `Error en la acción: ${action}`);
    }
    return result;
  };
};

// Hook para obtener productos de un proveedor específico
export const useProductsBySupplier = (supplierId?: string) => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;
  const invokeGetSupplierProducts = useTenantAction<SupplierProduct[], { supplierId?: string }>('get_supplier_products');

  return useQuery({
    queryKey: ['supplierProducts', tenantId, supplierId],
    queryFn: () => invokeGetSupplierProducts({ supplierId }),
    enabled: !!tenantId && !!supplierId, // Only enable if supplierId is provided
  });
};

// Hook para añadir un producto a un proveedor
export const useAddSupplierProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentAssignment } = useAuth();
  const invokeAddSupplierProduct = useTenantAction<SupplierProduct, AddSupplierProductData>('add_supplier_product');

  return useMutation({
    mutationFn: invokeAddSupplierProduct,
    onSuccess: (data, variables) => {
      // Invalidate the specific query for the supplier whose products were updated
      queryClient.invalidateQueries({ queryKey: ['supplierProducts', currentAssignment?.tenant_id, variables.supplier_id] });
      // Also invalidate the general master products list to reflect availability
      queryClient.invalidateQueries({ queryKey: ['master_products'] });
      toast({
        title: "Producto de proveedor añadido",
        description: "El producto se ha vinculado al proveedor exitosamente.",
      });
    },
    onError: (error) => {
      toast({ title: "Error al añadir producto de proveedor", description: error.message, variant: "destructive" });
    },
  });
};

// Hook para actualizar un producto de proveedor
export const useUpdateSupplierProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentAssignment } = useAuth();
  const invokeUpdateSupplierProduct = useTenantAction<SupplierProduct, UpdateSupplierProductData>('update_supplier_product');

  return useMutation({
    mutationFn: invokeUpdateSupplierProduct,
    onSuccess: (data) => {
      // After a successful update, invalidate the query for the specific supplier
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['supplierProducts', currentAssignment?.tenant_id, data.supplier_id] });
      }
      toast({
        title: "Producto de proveedor actualizado",
        description: "Los cambios se han guardado correctamente.",
      });
    },
    onError: (error) => {
      toast({ title: "Error al actualizar producto de proveedor", description: error.message, variant: "destructive" });
    },
  });
};

// Hook para activar/desactivar un producto de proveedor
export const useToggleSupplierProductStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentAssignment } = useAuth();
  const invokeToggleSupplierProductStatus = useTenantAction<SupplierProduct, { id: string; is_active: boolean }>('toggle_supplier_product_status');

  return useMutation({
    mutationFn: invokeToggleSupplierProductStatus,
    onSuccess: (data) => {
      // After a successful toggle, invalidate the query for the specific supplier
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['supplierProducts', currentAssignment?.tenant_id, data.supplier_id] });
      }
      toast({
        title: `Producto de proveedor ${data.is_active ? 'activado' : 'desactivado'}`,
        description: "El estado del producto de proveedor se ha actualizado.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({ title: "Error en el cambio de estado del producto de proveedor", description: error.message, variant: "destructive" });
    },
  });
};