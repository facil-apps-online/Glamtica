
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

interface SupplierProduct {
  id: string;
  supplier_id: string;
  product_id: string;
  supplier_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  products?: {
    id: string;
    name: string;
    price: number;
  };
  suppliers?: {
    id: string;
    name: string;
  };
}

interface CreateSupplierProductData {
  supplier_id: string;
  product_id: string;
  supplier_price: number;
}

export const useSupplierProducts = (supplierId?: string) => {
  return useQuery({
    queryKey: ['supplier-products', supplierId],
    queryFn: async () => {
      let query = supabase
        .from('supplier_products')
        .select(`
          *,
          products (id, name, price),
          suppliers (id, name)
        `)
        .order('created_at', { ascending: false });

      if (supplierId) {
        query = query.eq('supplier_id', supplierId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as SupplierProduct[];
    },
    enabled: !supplierId || !!supplierId,
  });
};

export const useProductsBySupplier = (supplierId: string) => {
  return useQuery({
    queryKey: ['supplier-products', supplierId, 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_products')
        .select(`
          *,
          products (id, name, price, stock_quantity)
        `)
        .eq('supplier_id', supplierId)
        .eq('is_active', true)
        .order('products(name)');

      if (error) throw error;
      return data as SupplierProduct[];
    },
    enabled: !!supplierId,
  });
};

export const useCreateSupplierProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateSupplierProductData) => {
      const { data: result, error } = await supabase
        .from('supplier_products')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] });
      toast({
        title: "Producto agregado al proveedor",
        description: "El producto se ha vinculado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo agregar el producto al proveedor.",
        variant: "destructive",
      });
      console.error('Error creating supplier product:', error);
    },
  });
};

export const useUpdateSupplierProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<CreateSupplierProductData & { is_active: boolean }> 
    }) => {
      const { data, error } = await supabase
        .from('supplier_products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] });
      toast({
        title: "Producto actualizado",
        description: "Los cambios se han guardado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto del proveedor.",
        variant: "destructive",
      });
      console.error('Error updating supplier product:', error);
    },
  });
};

export const useDeleteSupplierProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('supplier_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] });
      toast({
        title: "Producto eliminado",
        description: "El producto se ha eliminado del proveedor.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto del proveedor.",
        variant: "destructive",
      });
      console.error('Error deleting supplier product:', error);
    },
  });
};
