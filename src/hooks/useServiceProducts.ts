import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

export interface ServiceProduct {
  id: string;
  attention_id: string;
  attention_service_id: string;
  product_id: string;
  stylist_id: string;
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
  stylists?: {
    name: string;
  };
}

export const useServiceProducts = (attentionServiceId: string) => {
  return useQuery({
    queryKey: ['service-products', attentionServiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attention_service_products')
        .select(`
          *,
          products(name, price),
          stylists(name)
        `)
        .eq('attention_service_id', attentionServiceId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

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
      stylist_id: string;
      quantity: number;
      unit_price: number;
      commission_rate: number;
    }) => {
      const total_price = productData.quantity * productData.unit_price;
      
      // Verificar que el servicio existe y pertenece a la atención
      const { data: serviceExists, error: serviceError } = await supabase
        .from('attention_services')
        .select('id, attention_id, stylist_id')
        .eq('id', productData.attention_service_id)
        .eq('attention_id', productData.attention_id)
        .eq('stylist_id', productData.stylist_id)
        .single();

      if (serviceError || !serviceExists) {
        throw new Error('El servicio no existe o no pertenece a esta atención y estilista');
      }

      // Verificar stock disponible
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock_quantity, name')
        .eq('id', productData.product_id)
        .single();

      if (productError) {
        throw new Error('No se pudo verificar el producto');
      }

      if (product.stock_quantity !== null && product.stock_quantity < productData.quantity) {
        throw new Error(`Stock insuficiente. Solo hay ${product.stock_quantity} unidades de ${product.name}`);
      }

      const { data, error } = await supabase
        .from('attention_service_products')
        .insert([{
          ...productData,
          total_price,
        }])
        .select()
        .single();

      if (error) throw error;

      // Actualizar stock del producto
      if (product.stock_quantity !== null) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ 
            stock_quantity: product.stock_quantity - productData.quantity 
          })
          .eq('id', productData.product_id);

        if (updateError) {
          console.error('Error updating product stock:', updateError);
          // No lanzar error aquí para no fallar la venta, pero registrar el problema
        }
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['service-products', data.attention_service_id] });
      queryClient.invalidateQueries({ queryKey: ['attentions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Actualizar stock en la UI
      toast({
        title: "Producto agregado",
        description: "El producto ha sido agregado al servicio.",
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "No se pudo agregar el producto. Inténtalo de nuevo.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error('Error adding service product:', error);
    },
  });
};

export const useRemoveServiceProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, attention_service_id }: { id: string; attention_service_id: string }) => {
      const { error } = await supabase
        .from('attention_service_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return attention_service_id;
    },
    onSuccess: (attention_service_id) => {
      queryClient.invalidateQueries({ queryKey: ['service-products', attention_service_id] });
      queryClient.invalidateQueries({ queryKey: ['attentions'] });
      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado del servicio.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto. Inténtalo de nuevo.",
        variant: "destructive",
      });
      console.error('Error removing service product:', error);
    },
  });
};

export const useStylistProductCommission = (stylistId: string, productId: string) => {
  return useQuery({
    queryKey: ['stylist-product-commission', stylistId, productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_stylist_commissions')
        .select('commission_rate')
        .eq('stylist_id', stylistId)
        .eq('product_id', productId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data?.commission_rate || 0;
    },
    enabled: !!stylistId && !!productId,
  });
};