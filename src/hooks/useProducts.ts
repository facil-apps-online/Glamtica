import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { MasterProduct, BranchProduct } from "@/types/products";

// Assuming this interface is needed for the commission data returned by the Edge Function
export interface ProductCommission {
  id: string;
  product_id: string;
  user_id: string;
  commission_rate: number;
  created_at: string;
  updated_at: string;
  products?: {
    id: string;
    name: string;
  };
  users?: {
    id: string;
    first_name: string;
    last_name: string;
  };
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

// Hook to get products available in the selected branch
export const useBranchProducts = (branchId?: string) => {
  return useQuery<BranchProduct[], Error>({
    queryKey: ['branch_products', branchId],
    queryFn: () => callTenantAction('get_branch_products', { branchId }),
    enabled: !!branchId && branchId !== 'all',
  });
};

// Hook to get all master products (the general catalog)
export const useMasterProducts = (
  searchTerm?: string, 
  showInactive?: boolean,
  filterCategory?: string,
  filterBrand?: string
) => {
  return useQuery<MasterProduct[], Error>({
    queryKey: ['master_products', searchTerm, showInactive, filterCategory, filterBrand],
    queryFn: () => callTenantAction('get_master_products', { 
      searchTerm, 
      showInactive,
      category: filterCategory,
      brandId: filterBrand
    }),
  });
};

// Hook to get prices of a master product in all its assigned branches
export const useProductBranchPrices = (productId: string) => {
  return useQuery<BranchProduct[], Error>({
    queryKey: ['product_branch_prices', productId],
    queryFn: () => callTenantAction('get_product_branch_prices', { productId }),
    enabled: !!productId,
  });
};

// Hook to get product commissions by product and branch
export const useProductCommissionsByProduct = (productId?: string, branchId?: string) => {
  return useQuery<ProductCommission[], Error>({
    queryKey: ['product-commissions-by-product', productId, branchId],
    queryFn: () => callTenantAction('get_product_commissions_by_product_and_branch', { productId, branchId }),
    enabled: !!productId && !!branchId,
  });
};

// Mutation to assign a product to one or more branches
export const useAssignProductToBranch = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<any, Error, { product_id: string; branch_ids: string[]; defaults: { selling_price: number; stock_quantity: number; is_active?: boolean } }>({
    mutationFn: (payload) =>
      callTenantAction('assign_product_to_branch', payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['branch_products'] });
      // Invalidate master products if needed, depending on how they are displayed
      queryClient.invalidateQueries({ queryKey: ['master_products'] });
      toast({ title: "Asignación Exitosa", description: "El producto ha sido asignado a la(s) sucursal(es)." });
    },
    onError: (error: Error) => {
      toast({ title: "Error de Asignación", description: error.message, variant: "destructive" });
    },
  });
};

// Mutation to update a product in a specific branch
export const useUpdateBranchProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<BranchProduct, Error, { id: string; updates: Partial<Omit<BranchProduct, 'id'>> }>({
    mutationFn: ({ id, updates }) =>
      callTenantAction('update_branch_product', { id, updates }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch_products'] });
      toast({ title: "Producto Actualizado", description: "El precio o stock ha sido actualizado para esta sucursal." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

// Mutation to create a new master product
export const useCreateMasterProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<MasterProduct, Error, Omit<MasterProduct, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>({
    mutationFn: (productData) => 
      callTenantAction('create_master_product', { productData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master_products'] });
      toast({ title: "Producto Maestro Creado", description: "El producto ha sido añadido al catálogo general." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

// Mutation to update a master product
export const useUpdateMasterProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<MasterProduct, Error, { id: string; updates: Partial<MasterProduct> }>({
    mutationFn: ({ id, updates }) =>
      callTenantAction('update_master_product', { id, updates }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master_products'] });
      toast({ title: "Producto Maestro Actualizado", description: "La información del producto ha sido actualizada." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

// Mutation to remove a product from a branch
export const useRemoveProductFromBranch = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<any, Error, string>({
    mutationFn: (branch_product_id) =>
      callTenantAction('remove_product_from_branch', { branch_product_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch_products'] });
      toast({ title: "Producto Desvinculado", description: "El producto ha sido desvinculado de la sucursal." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};
