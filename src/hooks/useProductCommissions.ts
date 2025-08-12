
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

// Helper to call the tenant-actions Edge Function
const callTenantAction = async (action: string, payload: any) => {
  const { data, error } = await supabase.functions.invoke('tenant-actions', {
    body: { action, payload },
  });
  if (error) throw error;
  return data;
};

// Main interface for a product commission
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
}

// Interface for creating a new product commission
interface CreateProductCommissionData {
  product_id: string;
  user_id: string;
  branch_id: string;
  commission_rate: number;
}

// Hook to get all commissions for a specific user and branch
export const useProductCommissions = (productId?: string, branchId?: string, userId?: string) => {
  return useQuery<ProductCommission[], Error>({
    queryKey: ['product-commissions', userId, branchId],
    queryFn: () => callTenantAction('get_user_product_commissions', { userId, branchId }),
    enabled: !!userId && !!branchId,
  });
};

// Mutation to create a new product commission
export const useCreateProductCommission = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<ProductCommission, Error, CreateProductCommissionData>({
    mutationFn: (commissionData) => 
      callTenantAction('create_product_commission', { commissionData }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product-commissions'] });
      toast({ title: "Comisión asignada" });
    },
    onError: (error) => {
      toast({ title: "Error", description: `No se pudo asignar la comisión: ${error.message}`, variant: "destructive" });
    },
  });
};

// Mutation to update an existing product commission
export const useUpdateProductCommission = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<ProductCommission, Error, { id: string; updates: { commission_rate: number } }>({
    mutationFn: ({ id, updates }) => 
      callTenantAction('update_product_commission', { id, updates }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product-commissions'] });
      toast({ title: "Comisión actualizada" });
    },
    onError: (error) => {
      toast({ title: "Error", description: `No se pudo actualizar la comisión: ${error.message}`, variant: "destructive" });
    },
  });
};

// Mutation to delete a product commission
export const useDeleteProductCommission = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<{ success: boolean }, Error, { id: string; product_id: string }>({
    mutationFn: ({ id }) => 
      callTenantAction('delete_product_commission', { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-commissions'] });
      toast({ title: "Comisión eliminada" });
    },
    onError: (error) => {
      toast({ title: "Error", description: `No se pudo eliminar la comisión: ${error.message}`, variant: "destructive" });
    },
  });
};
