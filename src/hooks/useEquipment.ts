import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Equipment {
  id: string;
  name: string;
  type_id: string;
  brand_id?: string;
  brand_name?: string;
  model?: string;
  serial_number?: string;
  purchase_date?: string;
  last_maintenance_date?: string;
  maintenance_frequency?: number;
  maintenance_frequency_unit?: string;
  notes?: string;
  is_active: boolean;
  assigned_user_name?: string | null;
  branch_name?: string | null;
  current_assignment_id?: string | null;
}

// Helper function to call tenant-actions
const callTenantAction = async (action: string, payload?: any) => {
  const { data, error } = await supabase.functions.invoke('tenant-actions', {
    body: { action, payload },
  });
  if (error) throw error;
  return data;
};

export const useEquipment = (searchTerm?: string, showInactive?: boolean, typeId?: string, brandId?: string) => {
  const { currentAssignment } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch equipment
  const { data: equipment, isLoading: loading, refetch: refreshEquipment } = useQuery<Equipment[]>({
    queryKey: ['equipment', currentAssignment?.tenant_id, searchTerm, showInactive, typeId, brandId], // Include tenant_id and other filters in query key
    queryFn: async () => {
      if (!currentAssignment?.tenant_id) return [];
      const data = await callTenantAction('get_equipment', {
        searchTerm: searchTerm || null,
        showInactive: showInactive || false,
        typeId: typeId || null,
        brandId: brandId || null
      });

      const uniqueEquipment = Array.from(new Map(data.map(item => [item.id, item])).values());
      return uniqueEquipment;
    },
    enabled: !!currentAssignment?.tenant_id, // Enable only when tenant_id is available
  });

  // Add equipment
  const createEquipmentMutation = useMutation({
    mutationFn: (equipmentData: any) =>
      callTenantAction('create_equipment', { equipmentData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast({
        title: 'Éxito',
        description: 'Equipo creado correctamente.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Error al crear el equipo: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Update equipment
  const updateEquipmentMutation = useMutation({
    mutationFn: ({ equipmentId, equipmentData }: { equipmentId: string; equipmentData: any }) =>
      callTenantAction('update_equipment', { equipmentId, equipmentData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast({
        title: 'Éxito',
        description: 'Equipo actualizado correctamente.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Error al actualizar el equipo: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  return {
    equipment: equipment || [],
    loading,
    refreshEquipment,
    createEquipment: createEquipmentMutation.mutateAsync,
    updateEquipment: updateEquipmentMutation.mutateAsync,
  };
};

export const useUpdateEquipment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ equipmentId, equipmentData }: { equipmentId: string; equipmentData: any }) =>
      callTenantAction('update_equipment', { equipmentId, equipmentData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast({
        title: 'Éxito',
        description: 'Equipo actualizado correctamente.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Error al actualizar el equipo: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

export const useEquipmentById = (equipmentId: string) => {
  const { currentAssignment } = useAuth();

  return useQuery<Equipment, Error>({
    queryKey: ['equipment', equipmentId],
    queryFn: async () => {
      if (!currentAssignment?.tenant_id || !equipmentId) return null;
      const data = await callTenantAction('get_equipment_by_id', { equipmentId });
      return data;
    },
    enabled: !!currentAssignment?.tenant_id && !!equipmentId,
  });
};