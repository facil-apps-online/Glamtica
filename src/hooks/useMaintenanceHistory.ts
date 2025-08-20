import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from './use-toast';

export interface MaintenanceEvent {
  id: string;
  maintenance_date: string;
  notes: string;
}

export const useMaintenanceHistory = (equipmentId: string) => {
  const [history, setHistory] = useState<MaintenanceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();
  const { toast } = useToast();

  const fetchHistory = useCallback(async () => {
    if (!session?.user?.app_metadata?.assignments?.[0]?.tenant_id) {
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
        description: `Failed to load maintenance history: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [equipmentId, session, toast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const addMaintenanceRecord = useCallback(async (record: Omit<MaintenanceEvent, 'id'>) => {
    if (!session?.user?.app_metadata?.assignments?.[0]?.tenant_id) {
      toast({ title: 'Error', description: 'Tenant ID not found.', variant: 'destructive' });
      return null;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('tenant-actions', {
        body: {
          action: 'create_equipment_maintenance_record',
          payload: {
            maintenanceData: {
              equipment_id: equipmentId,
              maintenance_date: record.maintenance_date,
              notes: record.notes,
            },
          },
        },
      });

      if (error) throw error;
      toast({
        title: 'Éxito',
        description: 'Registro de mantenimiento añadido correctamente.',
      });
      await fetchHistory(); // Refresh history after adding
      return data as MaintenanceEvent;
    } catch (error: any) {
      console.error('Error adding maintenance record:', error);
      toast({
        title: 'Error',
        description: `Hubo un problema al añadir el registro de mantenimiento: ${error.message}`,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [equipmentId, fetchHistory, session, toast]);

  return { history, loading, addMaintenanceRecord, refreshHistory: fetchHistory };
};