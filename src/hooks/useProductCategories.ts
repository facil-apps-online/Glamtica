import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export const useProductCategories = () => {
  const { session, currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery<ProductCategory[], Error>({
    queryKey: ['productCategories', tenantId],
    queryFn: async () => {
      if (!tenantId || !session) return [];

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'get_product_categories',
          payload: { tenantId: tenantId },
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to fetch product categories');
      }
      return json as ProductCategory[];
    },
    enabled: !!tenantId && !!session,
  });
};

export const useCreateProductCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { session, currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useMutation({
    mutationFn: async (categoryData: Omit<ProductCategory, 'id' | 'created_at' | 'updated_at'>) => {
      if (!tenantId || !session) throw new Error("Tenant ID or session not available");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'create_product_category',
          payload: { tenantId: tenantId, ...categoryData },
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to create product category');
      }
      return json as ProductCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productCategories', tenantId] });
      toast({ title: "Categoría creada", description: "La categoría ha sido creada exitosamente.", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "No se pudo crear la categoría.", variant: "destructive" });
      console.error('Error creating product category:', error);
    },
  });
};

export const useUpdateProductCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { session, currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ProductCategory> }) => {
      if (!tenantId || !session) throw new Error("Tenant ID or session not available");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'update_product_category',
          payload: { tenantId: tenantId, id: id, ...updates },
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to update product category');
      }
      return json as ProductCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productCategories', tenantId] });
      toast({ title: "Categoría actualizada", description: "La categoría ha sido actualizada exitosamente.", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "No se pudo actualizar la categoría.", variant: "destructive" });
      console.error('Error updating product category:', error);
    },
  });
};

export const useDeleteProductCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { session, currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useMutation({
    mutationFn: async (id: string) => {
      if (!tenantId || !session) throw new Error("Tenant ID or session not available");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'delete_product_category',
          payload: { tenantId: tenantId, id: id },
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to delete product category');
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productCategories', tenantId] });
      toast({ title: "Categoría eliminada", description: "La categoría ha sido eliminada exitosamente.", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "No se pudo eliminar la categoría.", variant: "destructive" });
      console.error('Error deleting product category:', error);
    },
  });
};

export const useToggleProductCategoryStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { session, currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      if (!tenantId || !session) throw new Error("Tenant ID or session not available");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'toggle_product_category_status',
          payload: { tenantId: tenantId, id: id, is_active: is_active },
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to toggle product category status');
      }
      return json;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['productCategories', tenantId] });
      toast({
        title: data.is_active ? "Categoría activada" : "Categoría desactivada",
        description: `La categoría ha sido ${data.is_active ? 'activada' : 'desactivada'} exitosamente.`,
        variant: "success"
      });
    },
    onError: (error) => {
      toast({ title: "Error", description: "No se pudo cambiar el estado de la categoría.", variant: "destructive" });
      console.error('Error toggling product category status:', error);
    },
  });
};