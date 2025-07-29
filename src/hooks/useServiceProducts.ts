import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

export interface ServiceProduct {
  id: string;
  attention_id: string;
  attention_service_id: string;
  product_id: string;
  user_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  commission_rate: number;
  created_at: string;
  updated_at: string;
  products?: {
    name: string;
    price: number;
  };
  users?: {
    first_name: string;
    last_name: string;
  };
}

export const useServiceProducts = (attentionServiceId: string) => {
  return useQuery({
    queryKey: ['service-products', attentionServiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attention_service_products')
        .select(`*, products(name, price), users(first_name, last_name)`)
        .eq('attention_service_id', attentionServiceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ServiceProduct[];
    },
    enabled: !!attentionServiceId,
  });
};

export const useAddServiceProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (productData: {
      attention_id: string;
      attention_service_id: string;
      product_id: string;
      user_id: string;
      quantity: number;
      unit_price: number;
      commission_rate: number;
    }) => {
      const total_price = productData.quantity * productData.unit_price;
      
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock_quantity, name')
        .eq('id', productData.product_id)
        .single();

      if (productError) throw new Error('No se pudo verificar el producto');
      if (product.stock_quantity !== null && product.stock_quantity < productData.quantity) {
        throw new Error(`Stock insuficiente. Solo hay ${product.stock_quantity} unidades.`);
      }

      const { data, error } = await supabase
        .from('attention_service_products')
        .insert([{ ...productData, total_price }])
        .select()
        .single();

      if (error) throw error;

      if (product.stock_quantity !== null) {
        await supabase
          .from('products')
          .update({ stock_quantity: product.stock_quantity - productData.quantity })
          .eq('id', productData.product_id);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['service-products', data.attention_service_id] });
      queryClient.invalidateQueries({ queryKey: ['attentions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: "Producto agregado" });
    },
    onError: (error) => {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    },
  });
};

export const useUserProductCommission = (userId: string, productId: string) => {
  return useQuery({
    queryKey: ['user-product-commission', userId, productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_user_commissions')
        .select('commission_rate')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .maybeSingle();

      if (error) throw error;
      return data?.commission_rate;
    },
    enabled: !!userId && !!productId,
  });
};