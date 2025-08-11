import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useBranchFilterStore } from "@/stores/branchFilterStore";

// --- INTERFACES ---

// Interfaz para el producto maestro (catálogo general)
export interface MasterProduct {
  id: string;
  name: string;
  description?: string;
  cost_price?: number;
  last_purchase_cost?: number;
  average_cost?: number;
  is_active?: boolean;
  category?: string;
  brand_id?: string;
  barcode?: string;
  sku?: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

// Interfaz para el producto específico de una sucursal
export interface BranchProduct extends MasterProduct {
  branch_product_id: string;
  branch_id: string;
  selling_price: number;
  stock_quantity: number;
  min_stock?: number;
  max_stock?: number;
  is_branch_active: boolean;
}

// --- HELPERS ---

const callTenantAction = async (action: string, payload: any) => {
  const { data, error } = await supabase.functions.invoke('tenant-actions', {
    body: { action, payload },
  });
  if (error) throw error;
  return data;
};

// --- HOOKS ---

// Hook para obtener los productos disponibles en la sucursal seleccionada
export const useBranchProducts = (branchIdParam?: string) => {
  const { selectedBranchId } = useBranchFilterStore();
  const branchIdToUse = branchIdParam || selectedBranchId;

  return useQuery({
    queryKey: ['branch_products', branchIdToUse],
    queryFn: () => callTenantAction('get_branch_products', { branchId: branchIdToUse }),
    enabled: !!branchIdToUse && branchIdToUse !== 'all',
  });
};

// Hook para obtener todos los productos maestros (el catálogo general)
export const useMasterProducts = () => {
  return useQuery({
    queryKey: ['master_products'],
    queryFn: () => callTenantAction('get_master_products', {}),
  });
};

// Hook para obtener los precios de un producto maestro en todas sus sucursales
export const useProductBranchPrices = (productId: string) => {
  return useQuery({
    queryKey: ['product_branch_prices', productId],
    queryFn: () => callTenantAction('get_product_branch_prices', { productId }),
    enabled: !!productId,
  });
};

// --- MUTATIONS ---

// Crear un nuevo producto en el catálogo maestro
export const useCreateMasterProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (productData: Omit<MasterProduct, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => 
      callTenantAction('create_master_product', { productData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master_products'] });
      toast({ title: "Producto Creado", description: "El producto ha sido añadido al catálogo general." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

// Actualizar un producto del catálogo maestro
export const useUpdateMasterProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<MasterProduct> }) =>
      callTenantAction('update_master_product', { id, updates }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master_products'] });
      queryClient.invalidateQueries({ queryKey: ['branch_products'] });
      toast({ title: "Producto Actualizado", description: "La información del producto ha sido actualizada." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

// Asignar un producto a una o varias sucursales
export const useAssignProductToBranch = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: { product_id: string; branch_ids: string[]; defaults: { selling_price: number; stock_quantity: number; is_active?: boolean } }) =>
      callTenantAction('assign_product_to_branch', payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['branch_products'] });
      queryClient.invalidateQueries({ queryKey: ['product_branch_prices', variables.product_id] });
      toast({ title: "Asignación Exitosa", description: "El producto ha sido asignado a la(s) sucursal(es)." });
    },
    onError: (error: Error) => {
      toast({ title: "Error de Asignación", description: error.message, variant: "destructive" });
    },
  });
};

// Actualizar un producto en una sucursal específica
export const useUpdateBranchProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<BranchProduct, 'id'>> }) =>
      callTenantAction('update_branch_product', { id, updates }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch_products'] });
      toast({ title: "Producto Actualizado", description: "El precio, stock o estado ha sido actualizado para esta sucursal." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

// Desvincular un producto de una sucursal
export const useRemoveProductFromBranch = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (branch_product_id: string) =>
      callTenantAction('remove_product_from_branch', { branch_product_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch_products'] });
      toast({ title: "Producto Desvinculado", description: "El producto ha sido removido de esta sucursal." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};
