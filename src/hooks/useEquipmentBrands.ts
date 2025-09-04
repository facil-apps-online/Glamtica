import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface EquipmentBrand {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

// Helper function to call tenant-actions
const callTenantAction = async (action: string, payload?: any) => {
  const { data, error } = await supabase.functions.invoke('tenant-actions', {
    body: { action, payload },
  });
  if (error) throw error;
  return data;
};

export const useEquipmentBrands = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { session } = useAuth();

  // Fetch brands
  const { data: brands, isLoading: loading, error } = useQuery<EquipmentBrand[]>({ 
    queryKey: ['equipment_brands'],
    queryFn: async () => {
      if (!session) return [];
      return callTenantAction('get_equipment_brands');
    },
    enabled: !!session,
  });

  // Add brand
  const addBrandMutation = useMutation({
    mutationFn: (brandData: { name: string; description?: string }) =>
      callTenantAction('create_equipment_brand', brandData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment_brands'] });
      toast({
        title: 'Éxito',
        description: 'Marca de equipo creada correctamente.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Error al crear la marca de equipo: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Update brand
  const updateBrandMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<EquipmentBrand> }) =>
      callTenantAction('update_equipment_brand', { id, ...updates }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment_brands'] });
      toast({
        title: 'Éxito',
        description: 'Marca de equipo actualizada correctamente.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Error al actualizar la marca de equipo: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete brand
  const deleteBrandMutation = useMutation({
    mutationFn: (id: string) =>
      callTenantAction('delete_equipment_brand', { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment_brands'] });
      toast({
        title: 'Éxito',
        description: 'Marca de equipo eliminada correctamente.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Error al eliminar la marca de equipo: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  return {
    brands: brands || [],
    loading,
    addBrand: addBrandMutation.mutateAsync,
    updateBrand: updateBrandMutation.mutateAsync,
    deleteBrand: deleteBrandMutation.mutateAsync,
  };
};