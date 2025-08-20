import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

export interface EquipmentAssignment {
  id: string;
  user_name: string;
  branch_name: string;
  assignment_date: string; // Date string (YYYY-MM-DD)
  return_date: string | null; // Date string (YYYY-MM-DD) or null
}

export const useEquipmentAssignments = () => {
  const [assignments, setAssignments] = useState<EquipmentAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();

  const fetchEquipmentAssignments = useCallback(async (equipmentId?: string) => {
    if (!session?.user?.app_metadata?.assignments?.[0]?.tenant_id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('tenant-actions', {
        body: {
          action: 'get_equipment_assignments',
          payload: { equipmentId: equipmentId || null },
        },
      });

      if (error) throw error;
      setAssignments(data as EquipmentAssignment[]);
    } catch (error: any) {
      console.error('Error fetching equipment assignments:', error.message);
      toast({
        title: 'Error',
        description: `Failed to load equipment assignments: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [session, toast]);

  const assignEquipment = useCallback(async (equipmentId: string, userId: string, branchId: string): Promise<boolean> => {
    if (!session?.user?.app_metadata?.assignments?.[0]?.tenant_id) {
      toast({ title: 'Error', description: 'Tenant ID not found.', variant: 'destructive' });
      return false;
    }
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('tenant-actions', {
        body: {
          action: 'assign_equipment_to_user',
          payload: {
            equipmentId,
            userId,
            branchId,
            assignmentDate: new Date().toISOString().split('T')[0], // Current date
          },
        },
      });

      if (error) throw error;
      toast({
        title: 'Éxito',
        description: 'Equipo asignado correctamente.',
      });
      // Optionally refetch assignments if needed immediately after assignment
      // await fetchEquipmentAssignments(equipmentId);
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
      setLoading(false);
    }
  }, [session, toast]);

  const returnEquipment = useCallback(async (assignmentId: string): Promise<boolean> => {
    if (!session?.user?.app_metadata?.assignments?.[0]?.tenant_id) {
      toast({ title: 'Error', description: 'Tenant ID not found.', variant: 'destructive' });
      return false;
    }
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('tenant-actions', {
        body: {
          action: 'return_equipment',
          payload: {
            assignmentId,
            returnDate: new Date().toISOString().split('T')[0], // Current date
          },
        },
      });

      if (error) throw error;
      toast({
        title: 'Éxito',
        description: 'Equipo devuelto correctamente.',
      });
      // Optionally refetch assignments if needed immediately after return
      // await fetchEquipmentAssignments();
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
      setLoading(false);
    }
  }, [session, toast]);

  return { assignments, loading, fetchEquipmentAssignments, assignEquipment, returnEquipment };
};