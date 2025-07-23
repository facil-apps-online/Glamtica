import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useBranchFilterStore } from "@/stores/branchFilterStore";

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  cost_price?: number;
  last_purchase_cost?: number;
  average_cost?: number;
  stock_quantity?: number;
  min_stock?: number;
  max_stock?: number;
  is_active?: boolean;
  category?: string;
  brand_id?: string;
  barcode?: string;
  sku?: string;
  created_at: string;
  updated_at: string;
}

// --- QUERIES REFACTORIZADAS ---

export const useProducts = () => {
  const { currentAssignment } = useAuth();
  const { selectedBranchId } = useBranchFilterStore();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery({
    queryKey: ['products', tenantId, selectedBranchId],
    queryFn: async () => {
      if (!tenantId) return [];
      let query = supabase.from('products').select('*').eq('tenant_id', tenantId);
      if (selectedBranchId !== 'all') {
        query = query.eq('branch_id', selectedBranchId);
      }
      const { data, error } = await query.order('name');
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!tenantId,
  });
};

export const useActiveProducts = () => {
  const { currentAssignment } = useAuth();
  const { selectedBranchId } = useBranchFilterStore();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery({
    queryKey: ['products', 'active', tenantId, selectedBranchId],
    queryFn: async () => {
      if (!tenantId) return [];
      let query = supabase.from('products').select('*').eq('tenant_id', tenantId).eq('is_active', true);
      if (selectedBranchId !== 'all') {
        query = query.eq('branch_id', selectedBranchId);
      }
      const { data, error } = await query.order('name');
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!tenantId,
  });
};

// --- MUTACIONES RESTAURADAS ---

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useMutation({
    mutationFn: async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('products').insert([productData]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', tenantId] });
      toast({ title: "Producto creado", description: "El producto ha sido creado exitosamente." });
    },
    onError: (error) => {
      toast({ title: "Error", description: "No se pudo crear el producto.", variant: "destructive" });
      console.error('Error creating product:', error);
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Product> }) => {
      const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', tenantId] });
      toast({ title: "Producto actualizado", description: "El producto ha sido actualizado exitosamente." });
    },
    onError: (error) => {
      toast({ title: "Error", description: "No se pudo actualizar el producto.", variant: "destructive" });
      console.error('Error updating product:', error);
    },
  });
};

export const useToggleProductStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase.from('products').update({ is_active }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products', tenantId] });
      toast({
        title: data.is_active ? "Producto activado" : "Producto desactivado",
        description: `El producto ha sido ${data.is_active ? 'activado' : 'desactivado'} exitosamente.`,
      });
    },
    onError: (error) => {
      toast({ title: "Error", description: "No se pudo cambiar el estado del producto.", variant: "destructive" });
      console.error('Error toggling product status:', error);
    },
  });
};
