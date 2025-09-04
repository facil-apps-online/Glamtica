import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface EquipmentType {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

// Helper function to call tenant-actions
const callTenantAction = async (action: string, payload?: any) => {
  const { data, error } = await supabase.functions.invoke('tenant-actions', {
    body: { action, payload },
  });
  if (error) throw error;
  return data;
};

export const useEquipmentTypes = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { session } = useAuth();

  // Fetch types
  const { data: types, isLoading: loading } = useQuery<EquipmentType[]>({ 
    queryKey: ['equipment_types'],
    queryFn: async () => {
      if (!session?.user?.app_metadata?.assignments?.[0]?.tenant_id) return [];
      return callTenantAction('get_equipment_types');
    },
    enabled: !!session?.user?.app_metadata?.assignments?.[0]?.tenant_id,
  });

  // Add type
  const addTypeMutation = useMutation({
    mutationFn: (typeData: { name: string; description?: string }) =>
      callTenantAction('create_equipment_type', typeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment_types'] });
      toast({
        title: 'Éxito',
        description: 'Tipo de equipo añadido correctamente.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Error al añadir el tipo de equipo: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Update type
  const updateTypeMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<EquipmentType> }) =>
      callTenantAction('update_equipment_type', { id, ...updates }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment_types'] });
      toast({
        title: 'Éxito',
        description: 'Tipo de equipo actualizado correctamente.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Error al actualizar el tipo de equipo: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete type
  const deleteTypeMutation = useMutation({
    mutationFn: (id: string) =>
      callTenantAction('delete_equipment_type', { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment_types'] });
      toast({
        title: 'Éxito',
        description: 'Tipo de equipo eliminado correctamente.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Error al eliminar el tipo de equipo: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  return {
    types: types || [],
    loading,
    addType: addTypeMutation.mutateAsync,
    updateType: updateTypeMutation.mutateAsync,
    deleteType: deleteTypeMutation.mutateAsync,
  };
};