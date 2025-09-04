
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface Brand {
  id: string;
  name: string;
  description?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export const useBrands = () => {
  const { session, currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery<Brand[], Error>({
    queryKey: ['brands', tenantId],
    queryFn: async () => {
      if (!tenantId || !session) return [];

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'get_brands',
          payload: { tenantId: tenantId },
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to fetch brands');
      }
      return json as Brand[];
    },
    enabled: !!tenantId && !!session,
  });
};

export const useActiveBrands = () => {
  const { session, currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery<Brand[], Error>({
    queryKey: ['brands', 'active', tenantId],
    queryFn: async () => {
      if (!tenantId || !session) return [];

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'get_brands',
          payload: { tenantId: tenantId, isActive: true },
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to fetch active brands');
      }
      return json as Brand[];
    },
    enabled: !!tenantId && !!session,
  });
};

export const useCreateBrand = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { session, currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useMutation({
    mutationFn: async (brandData: {
      name: string;
      description?: string;
    }) => {
      if (!tenantId || !session) throw new Error("Tenant ID or session not available");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'create_brand',
          payload: { tenantId: tenantId, ...brandData },
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to create brand');
      }
      return json as Brand;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands', tenantId] });
      toast({
        title: "Marca creada",
        description: "La marca ha sido creada exitosamente.",
        variant: "success"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear la marca. Inténtalo de nuevo.",
        variant: "destructive",
      });
      console.error('Error creating brand:', error);
    },
  });
};

export const useUpdateBrand = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { session, currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Brand> }) => {
      if (!tenantId || !session) throw new Error("Tenant ID or session not available");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'update_brand',
          payload: { tenantId: tenantId, id: id, ...updates },
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to update brand');
      }
      return json as Brand;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands', tenantId] });
      toast({
        title: "Marca actualizada",
        description: "La marca ha sido actualizada exitosamente.",
        variant: "success"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la marca. Inténtalo de nuevo.",
        variant: "destructive",
      });
      console.error('Error updating brand:', error);
    },
  });
};

export const useDeleteBrand = () => {
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
          action: 'delete_brand',
          payload: { tenantId: tenantId, id: id },
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to delete brand');
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands', tenantId] });
      toast({ title: "Marca eliminada", description: "La marca ha sido eliminada exitosamente.", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "No se pudo eliminar la marca.", variant: "destructive" });
      console.error('Error deleting brand:', error);
    },
  });
};

export const useToggleBrandStatus = () => {
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
          action: 'toggle_brand_status',
          payload: { tenantId: tenantId, id: id, is_active: is_active },
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to toggle brand status');
      }
      return json;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['brands', tenantId] });
      toast({
        title: data.is_active ? "Marca activada" : "Marca desactivada",
        description: `La marca ha sido ${data.is_active ? 'activada' : 'desactivada'} exitosamente.`,
        variant: "success"
      });
    },
    onError: (error) => {
      toast({ title: "Error", description: "No se pudo cambiar el estado de la marca.", variant: "destructive" });
      console.error('Error toggling brand status:', error);
    },
  });
};
