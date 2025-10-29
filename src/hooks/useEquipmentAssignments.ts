import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface EquipmentAssignment {
  id: string;
  user_name: string;
  branch_name: string;
  assignment_date: string; // Date string (YYYY-MM-DD)
  return_date: string | null; // Date string (YYYY-MM-DD) or null
  created_at: string;
}

export const useEquipmentAssignments = (equipmentId?: string) => {
  const { toast } = useToast();
  const { session, currentAssignment } = useAuth();
  const queryClient = useQueryClient();

  const tenantId = currentAssignment?.tenant_id;

  const { data: assignments, isLoading: loading, refetch: refreshAssignments } = useQuery<EquipmentAssignment[], Error>({
    queryKey: ['equipmentAssignments', tenantId, equipmentId],
    queryFn: async () => {
      if (!tenantId || !equipmentId) return [];
      const { data, error } = await supabase.functions.invoke('tenant-actions', {
        body: {
          action: 'get_equipment_assignments',
          payload: { tenantId, equipmentId },
        },
      });

      if (error) throw error;
      // Sort assignments by created_at in descending order
      const sortedData = (data as EquipmentAssignment[]).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return sortedData;
    },
    enabled: !!tenantId && !!equipmentId,
  });

  const assignEquipment = useCallback(async (equipmentId: string, userId: string, branchId: string): Promise<boolean> => {
    if (!session?.user?.app_metadata?.assignments?.[0]?.tenant_id) {
      toast({ title: 'Error', description: 'Tenant ID not found.', variant: 'destructive' });
      return false;
    }
    // setLoading(true); // Removed as useMutation handles loading state
    try {
      const { error } = await supabase.functions.invoke('tenant-actions', {
        body: {
          action: 'assign_equipment_to_user',
          payload: {
            equipmentId,
            userId,
            branchId,
            tenant_id: session.user.app_metadata.assignments[0].tenant_id,
            assignmentDate: new Date().toISOString().split('T')[0], // Current date
          },
        },
      });

      if (error) throw error;
      toast({
        title: 'Éxito',
        description: 'Equipo asignado correctamente.',
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['equipmentAssignments', tenantId, equipmentId] });
      queryClient.invalidateQueries({ queryKey: ['userAssignedEquipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      return true;
    } catch (error: any) {
      console.error('Error assigning equipment:', error);
      toast({
        title: 'Error',
        description: `Hubo un problema al asignar el equipo: ${error.message}`,
        variant: 'destructive',
      });
      return false;
    } finally {
      // setLoading(false); // Removed as useMutation handles loading state
    }
  }, [session, toast, queryClient, tenantId, equipmentId]);

  const returnEquipment = useCallback(async (assignmentId: string): Promise<boolean> => {
    if (!session?.user?.app_metadata?.assignments?.[0]?.tenant_id) {
      toast({ title: 'Error', description: 'Tenant ID not found.', variant: 'destructive' });
      return false;
    }
    // setLoading(true); // Removed as useMutation handles loading state
    try {
      const { error } = await supabase.functions.invoke('tenant-actions', {
        body: {
          action: 'return_equipment',
          payload: {
            assignmentId,
            tenant_id: session.user.app_metadata.assignments[0].tenant_id,
            returnDate: new Date().toISOString().split('T')[0], // Current date
          },
        },
      });

      if (error) throw error;
      toast({
        title: 'Éxito',
        description: 'Equipo devuelto correctamente.',
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['equipmentAssignments', tenantId, equipmentId] });
      queryClient.invalidateQueries({ queryKey: ['userAssignedEquipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      return true;
    } catch (error: any) {
      console.error('Error returning equipment:', error);
      toast({
        title: 'Error',
        description: `Hubo un problema al devolver el equipo: ${error.message}`,
        variant: 'destructive',
      });
      return false;
    } finally {
      // setLoading(false); // Removed as useMutation handles loading state
    }
  }, [session, toast, queryClient, tenantId, equipmentId]);

  return { assignments: assignments || [], loading, refreshAssignments, assignEquipment, returnEquipment };
};