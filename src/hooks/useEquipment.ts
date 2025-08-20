import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './use-toast';

export interface Equipment {
  id: string;
  name: string;
  type_name: string;
  brand: string;
  model: string;
  serial_number: string;
  assigned_user_name: string | null;
  branch_name: string | null;
  // Add other fields from the equipment table if needed for full representation
  // For now, I'll stick to what get_equipment returns.
  // If the UI needs more details (e.g., purchase_date, is_active),
  // I'll need to update the RPC or fetch them separately.
}

export const useEquipment = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();
  const { toast } = useToast();

  const fetchEquipment = useCallback(async (branchId?: string, userId?: string) => {
    if (!session?.user?.app_metadata?.assignments?.[0]?.tenant_id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('tenant-actions', {
        body: {
          action: 'get_equipment',
          payload: {
            branchId: branchId || null, // Pass null if not provided
            userId: userId || null,     // Pass null if not provided
          },
        },
      });

      if (error) throw error;
      setEquipment(data as Equipment[]);
    } catch (error: any) {
      console.error('Error fetching equipment:', error.message);
      toast({
        title: 'Error',
        description: `Failed to load equipment: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [session, toast]);

  useEffect(() => {
    fetchEquipment(); // Initial fetch without filters
  }, [fetchEquipment]);

  const refreshEquipment = useCallback((branchId?: string, userId?: string) => {
    fetchEquipment(branchId, userId);
  }, [fetchEquipment]);

  return { equipment, loading, refreshEquipment, fetchEquipment }; // Export fetchEquipment for direct use with filters
};