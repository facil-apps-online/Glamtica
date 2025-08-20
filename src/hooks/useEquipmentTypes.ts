import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient'; // Assuming this path
import { useAuth } from '../contexts/AuthContext'; // Assuming this path
import { useToast } from './use-toast'; // Assuming this path

export interface EquipmentType {
  id: string;
  name: string;
  description?: string;
  is_active: boolean; // Added is_active
}

export const useEquipmentTypes = () => {
  const [types, setTypes] = useState<EquipmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth(); // Get session to access tenantId
  const { toast } = useToast();

  const fetchEquipmentTypes = useCallback(async () => {
    console.log("useEquipmentTypes: fetchEquipmentTypes called.");
    if (!session?.user?.app_metadata?.assignments?.[0]?.tenant_id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('tenant-actions', {
        body: {
          action: 'get_equipment_types',
          payload: {}, // No specific payload needed, tenantId is from JWT
        },
      });

      if (error) throw error;
      setTypes(data as EquipmentType[]);
    } catch (error: any) {
      console.error('Error fetching equipment types:', error.message);
      toast({
        title: 'Error',
        description: `Failed to load equipment types: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [session, toast]);

  useEffect(() => {
    fetchEquipmentTypes();
  }, [fetchEquipmentTypes]);

  const addType = useCallback(async (type: Omit<EquipmentType, 'id' | 'is_active'>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('tenant-actions', {
        body: {
          action: 'create_equipment_type',
          payload: {
            name: type.name,
            description: type.description,
          },
        },
      });

      if (error) throw error;
      toast({
        title: 'Success',
        description: 'Equipment type added successfully.',
      });
      await fetchEquipmentTypes(); // Re-fetch to update UI
      return data as EquipmentType;
    } catch (error: any) {
      console.error('Error adding equipment type:', error.message);
      toast({
        title: 'Error',
        description: `Failed to add equipment type: ${error.message}`,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchEquipmentTypes, toast]);

  const updateType = useCallback(async (id: string, updates: Partial<EquipmentType>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('tenant-actions', {
        body: {
          action: 'update_equipment_type',
          payload: {
            id,
            ...updates,
          },
        },
      });

      if (error) throw error;
      toast({
        title: 'Success',
        description: 'Equipment type updated successfully.',
      });
      await fetchEquipmentTypes(); // Re-fetch to update UI
    } catch (error: any) {
      console.error('Error updating equipment type:', error.message);
      toast({
        title: 'Error',
        description: `Failed to update equipment type: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [fetchEquipmentTypes, toast]);

  const deleteType = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('tenant-actions', {
        body: {
          action: 'delete_equipment_type',
          payload: { id },
        },
      });

      if (error) throw error;
      toast({
        title: 'Success',
        description: 'Equipment type deleted successfully.',
      });
      await fetchEquipmentTypes(); // Re-fetch to update UI
    } catch (error: any) {
      console.error('Error deleting equipment type:', error.message);
      toast({
        title: 'Error',
        description: `Failed to delete equipment type: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [fetchEquipmentTypes, toast]);

  return { types, loading, addType, updateType, deleteType, fetchEquipmentTypes };
};