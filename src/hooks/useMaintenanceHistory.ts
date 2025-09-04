import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from './use-toast';

export interface MaintenanceEvent {
  id: string;
  equipment_id: string;
  maintenance_date: string;
  notes: string;
}

export const useMaintenanceHistory = (equipmentId: string) => {
  const [history, setHistory] = useState<MaintenanceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchHistory = useCallback(async () => {
    if (!equipmentId) {
        setHistory([]);
        setLoading(false);
        return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('tenant-actions', {
        body: {
          action: 'get_equipment_maintenance_history',
          payload: { equipmentId },
        },
      });

      if (error) throw error;
      setHistory(data as MaintenanceEvent[]);
    } catch (error: any) {
      console.error('Error fetching maintenance history:', error.message);
      toast({
        title: 'Error',
        description: `No se pudo cargar el historial: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [equipmentId, toast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const addMaintenanceRecord = useCallback(async (record: Omit<MaintenanceEvent, 'id' | 'equipment_id'>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('tenant-actions', {
        body: {
          action: 'create_equipment_maintenance_record',
          payload: {
            maintenanceData: {
              ...record,
              equipment_id: equipmentId,
            },
          },
        },
      });

      if (error) throw error;
      toast({
        title: 'Éxito',
        description: 'Registro añadido correctamente.',
        variant: 'success',
      });
      await fetchHistory();
      return data as MaintenanceEvent;
    } catch (error: any) {
      console.error('Error adding maintenance record:', error);
      toast({
        title: 'Error',
        description: `Hubo un problema al añadir el registro: ${error.message}`,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [equipmentId, fetchHistory, toast]);

  const updateMaintenanceRecord = useCallback(async (id: string, updates: Partial<Omit<MaintenanceEvent, 'id' | 'equipment_id'>>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('tenant-actions', {
        body: {
          action: 'update_equipment_maintenance_record',
          payload: {
            recordId: id,
            updates,
          },
        },
      });

      if (error) throw error;
      toast({
        title: 'Éxito',
        description: 'Registro actualizado.',
        variant: 'success',
      });
      await fetchHistory();
      return data as MaintenanceEvent;
    } catch (error: any) {
      console.error('Error updating maintenance record:', error);
      toast({
        title: 'Error',
        description: `Hubo un problema al actualizar: ${error.message}`,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchHistory, toast]);

  const deleteMaintenanceRecord = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('tenant-actions', {
        body: {
          action: 'delete_equipment_maintenance_record',
          payload: { recordId: id },
        },
      });

      if (error) throw error;
      toast({
        title: 'Éxito',
        description: 'Registro eliminado.',
        variant: 'success',
      });
      await fetchHistory();
      return true;
    } catch (error: any) {
      console.error('Error deleting maintenance record:', error);
      toast({
        title: 'Error',
        description: `Hubo un problema al eliminar: ${error.message}`,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchHistory, toast]);


  return { 
    history, 
    loading, 
    addMaintenanceRecord, 
    updateMaintenanceRecord,
    deleteMaintenanceRecord,
    refreshHistory: fetchHistory 
  };
};