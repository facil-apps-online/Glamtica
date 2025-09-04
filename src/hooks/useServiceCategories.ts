import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export const useServiceCategories = () => {
  const { session, currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery<ServiceCategory[], Error>({
    queryKey: ['serviceCategories', tenantId],
    queryFn: async () => {
      if (!tenantId || !session) return [];

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'get_service_categories',
          payload: { tenantId: tenantId },
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to fetch service categories');
      }
      return json as ServiceCategory[];
    },
    enabled: !!tenantId && !!session,
  });
};

export const useCreateServiceCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { session, currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useMutation({
    mutationFn: async (categoryData: Omit<ServiceCategory, 'id' | 'created_at' | 'updated_at'>) => {
      if (!tenantId || !session) throw new Error("Tenant ID or session not available");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'create_service_category',
          payload: { tenantId: tenantId, ...categoryData },
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to create service category');
      }
      return json as ServiceCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceCategories', tenantId] });
      toast({ title: "Categoría creada", description: "La categoría ha sido creada exitosamente.", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "No se pudo crear la categoría.", variant: "destructive" });
      console.error('Error creating service category:', error);
    },
  });
};

export const useUpdateServiceCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { session, currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ServiceCategory> }) => {
      if (!tenantId || !session) throw new Error("Tenant ID or session not available");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'update_service_category',
          payload: { tenantId: tenantId, id: id, ...updates },
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to update service category');
      }
      return json as ServiceCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceCategories', tenantId] });
      toast({ title: "Categoría actualizada", description: "La categoría ha sido actualizada exitosamente.", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "No se pudo actualizar la categoría.", variant: "destructive" });
      console.error('Error updating service category:', error);
    },
  });
};

export const useDeleteServiceCategory = () => {
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
          action: 'delete_service_category',
          payload: { tenantId: tenantId, id: id },
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to delete service category');
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceCategories', tenantId] });
      toast({ title: "Categoría eliminada", description: "La categoría ha sido eliminada exitosamente.", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "No se pudo eliminar la categoría.", variant: "destructive" });
      console.error('Error deleting service category:', error);
    },
  });
};

export const useToggleServiceCategoryStatus = () => {
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
          action: 'toggle_service_category_status',
          payload: { tenantId: tenantId, id: id, is_active: is_active },
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to toggle service category status');
      }
      return json;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['serviceCategories', tenantId] });
      toast({
        title: data.is_active ? "Categoría activada" : "Categoría desactivada",
        description: `La categoría ha sido ${data.is_active ? 'activada' : 'desactivada'} exitosamente.`,
        variant: "success"
      });
    },
    onError: (error) => {
      toast({ title: "Error", description: "No se pudo cambiar el estado de la categoría.", variant: "destructive" });
      console.error('Error toggling service category status:', error);
    },
  });
};