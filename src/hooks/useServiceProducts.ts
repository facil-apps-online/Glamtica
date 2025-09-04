
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

export const useServiceProducts = (attentionServiceId: string) => {
  return useQuery<(Tables<'attention_products'> & { products: Tables<'products'> })[], Error>({
    queryKey: ['service-products', attentionServiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attention_products')
        .select('*, products (*)')
        .eq('attention_service_id', attentionServiceId);

      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!attentionServiceId,
  });
};

export const useAddServiceProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (newProduct: Omit<Tables<'attention_products'>, 'id' | 'created_at' | 'updated_at' | 'total_price'>) => {
      const { data, error } = await supabase
        .from('attention_products')
        .insert(newProduct)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['service-products', data.attention_service_id] });
      queryClient.invalidateQueries({ queryKey: ['attentions'] });
      toast({ title: "Producto agregado", description: "El producto ha sido agregado al servicio.", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error al agregar producto", description: error.message, variant: "destructive" });
    },
  });
};

export const useUserProductCommission = (userId: string, productId: string) => {
  return useQuery<number | null, Error>({
    queryKey: ['user-product-commission', userId, productId],
    queryFn: async () => {
      if (!userId || !productId) return null;

      const { data, error } = await supabase
        .from('product_commissions')
        .select('commission_rate')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116: no rows found
        throw new Error(error.message);
      }

      return data?.commission_rate || null;
    },
    enabled: !!userId && !!productId,
  });
};
