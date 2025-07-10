
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

export interface ProductCommission {
  id: string;
  product_id: string;
  stylist_id: string;
  commission_rate: number;
  created_at: string;
  updated_at: string;
  stylists?: {
    id: string;
    name: string;
  };
}

export const useProductCommissions = (productId: string) => {
  return useQuery({
    queryKey: ['product-commissions', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_stylist_commissions')
        .select(`
          *,
          stylists (
            id,
            name
          )
        `)
        .eq('product_id', productId);

      if (error) {
        throw error;
      }

      return data as ProductCommission[];
    },
  });
};

export const useCreateProductCommission = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (commissionData: {
      product_id: string;
      stylist_id: string;
      commission_rate: number;
    }) => {
      const { data, error } = await supabase
        .from('product_stylist_commissions')
        .insert([commissionData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product-commissions', data.product_id] });
      toast({
        title: "Comisión asignada",
        description: "La comisión ha sido asignada exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo asignar la comisión. Inténtalo de nuevo.",
        variant: "destructive",
      });
      console.error('Error creating commission:', error);
    },
  });
};

export const useUpdateProductCommission = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      id, 
      commission_rate,
      product_id 
    }: { 
      id: string; 
      commission_rate: number;
      product_id: string;
    }) => {
      const { data, error } = await supabase
        .from('product_stylist_commissions')
        .update({ commission_rate })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, product_id };
    },
    onSuccess: ({ product_id }) => {
      queryClient.invalidateQueries({ queryKey: ['product-commissions', product_id] });
      toast({
        title: "Comisión actualizada",
        description: "La comisión ha sido actualizada exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la comisión. Inténtalo de nuevo.",
        variant: "destructive",
      });
      console.error('Error updating commission:', error);
    },
  });
};

export const useDeleteProductCommission = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, product_id }: { id: string; product_id: string }) => {
      const { error } = await supabase
        .from('product_stylist_commissions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return product_id;
    },
    onSuccess: (product_id) => {
      queryClient.invalidateQueries({ queryKey: ['product-commissions', product_id] });
      toast({
        title: "Comisión eliminada",
        description: "La comisión ha sido eliminada exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la comisión. Inténtalo de nuevo.",
        variant: "destructive",
      });
      console.error('Error deleting commission:', error);
    },
  });
};
