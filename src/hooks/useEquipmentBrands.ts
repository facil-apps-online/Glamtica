import { useState, useEffect, useCallback } from 'react';
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

export const useEquipmentBrands = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [brands, setBrands] = useState<EquipmentBrand[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBrands = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('tenant-actions', {
        body: { action: 'get_equipment_brands' },
      });

      if (error) throw error;
      setBrands(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Error al cargar las marcas de equipos: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [session, toast]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const addBrand = async (brandData: { name: string; description?: string }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('tenant-actions', {
        body: { action: 'create_equipment_brand', payload: brandData },
      });
      if (error) throw error;
      toast({
        title: 'Éxito',
        description: 'Marca de equipo creada correctamente.',
      });
      fetchBrands(); // Refresh list
      return data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Error al crear la marca de equipo: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBrand = async (id: string, updates: Partial<EquipmentBrand>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('tenant-actions', {
        body: { action: 'update_equipment_brand', payload: { id, ...updates } },
      });
      if (error) throw error;
      toast({
        title: 'Éxito',
        description: 'Marca de equipo actualizada correctamente.',
      });
      fetchBrands(); // Refresh list
      return data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Error al actualizar la marca de equipo: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteBrand = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('tenant-actions', {
        body: { action: 'delete_equipment_brand', payload: { id } },
      });
      if (error) throw error;
      toast({
        title: 'Éxito',
        description: 'Marca de equipo eliminada correctamente.',
      });
      fetchBrands(); // Refresh list
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Error al eliminar la marca de equipo: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return { brands, loading, fetchBrands, addBrand, updateBrand, deleteBrand };
};