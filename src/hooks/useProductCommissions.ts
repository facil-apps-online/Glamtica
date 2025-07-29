
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

export interface ProductCommission {
  id: string;
  product_id: string;
  user_id: string;
  commission_rate: number;
  created_at: string;
  updated_at: string;
  users?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

interface CreateProductCommissionData {
  product_id: string;
  user_id: string;
  branch_id: string;
  commission_rate: number;
}

export const useProductCommissions = (productId?: string, branchId?: string) => {
  return useQuery({
    queryKey: ['product-commissions', productId, branchId],
    queryFn: async () => {
      let query = supabase
        .from('product_user_commissions')
        .select(`*, users(id, first_name, last_name)`)
        .order('created_at', { ascending: false });

      if (productId) query = query.eq('product_id', productId);
      if (branchId) query = query.eq('branch_id', branchId);

      const { data, error } = await query;
      if (error) throw error;
      return data as ProductCommission[];
    },
    enabled: !!branchId,
  });
};

export const useCreateProductCommission = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (commissionData: CreateProductCommissionData) => {
      const { data, error } = await supabase
        .from('product_user_commissions')
        .insert([commissionData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product-commissions', data.product_id] });
      toast({ title: "Comisión asignada" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "No se pudo asignar la comisión.", variant: "destructive" });
    },
  });
};

export const useUpdateProductCommission = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, commission_rate }: { id: string; commission_rate: number }) => {
      const { data, error } = await supabase
        .from('product_user_commissions')
        .update({ commission_rate })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product-commissions', data.product_id] });
      toast({ title: "Comisión actualizada" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "No se pudo actualizar la comisión.", variant: "destructive" });
    },
  });
};

export const useDeleteProductCommission = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, product_id }: { id: string; product_id: string }) => {
      const { error } = await supabase
        .from('product_user_commissions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return product_id;
    },
    onSuccess: (product_id) => {
      queryClient.invalidateQueries({ queryKey: ['product-commissions', product_id] });
      toast({ title: "Comisión eliminada" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "No se pudo eliminar la comisión.", variant: "destructive" });
    },
  });
};
