import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUomStore } from '@/stores/uomStore';

export const useUnitsOfMeasure = () => {
  const { supabaseClient: supabase } = useAuth();
  const { units, setUnits, updateUnitState, removeUnit } = useUomStore();
  
  // Restauramos el estado local para carga y errores, que es transitorio y no necesita ser global.
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchUnits = useCallback(async () => {
    if (!supabase) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.functions.invoke('tenant-actions', {
        body: {
          action: 'MANAGE_UOM',
          payload: { operation: 'GET' },
        },
      });
      if (rpcError) throw rpcError;
      setUnits(data || []);
    } catch (err: any) {
      setError(err);
      console.error('Error fetching units of measure:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, setUnits]);

  useEffect(() => {
    // Solo hacemos el fetch si tenemos el cliente de supabase y el store está vacío.
    if (supabase && units.length === 0) {
      fetchUnits();
    }
  }, [supabase, units.length, fetchUnits]);

  const createUnit = async (unitData: { name: string; abbreviation: string }) => {
    if (!supabase) throw new Error("Supabase client not available");
    setIsLoading(true);
    try {
      const { error: rpcError } = await supabase.functions.invoke('tenant-actions', {
        body: {
          action: 'MANAGE_UOM',
          payload: { operation: 'CREATE', uomData: unitData },
        },
      });
      if (rpcError) throw rpcError;
      await fetchUnits(); // Refrescar toda la lista para obtener el nuevo item
    } catch (err: any) {
      console.error('Error creating unit of measure:', err);
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUnit = async (id: string, unitData: { name: string; abbreviation: string }) => {
    if (!supabase) throw new Error("Supabase client not available");
    try {
      const { error: rpcError } = await supabase.functions.invoke('tenant-actions', {
        body: {
          action: 'MANAGE_UOM',
          payload: { operation: 'UPDATE', uomData: { id, ...unitData } },
        },
      });
      if (rpcError) throw rpcError;
      updateUnitState({ id, ...unitData }); // Actualización optimista en el store
    } catch (err: any) {
      console.error('Error updating unit of measure:', err);
      setError(err);
      throw err;
    }
  };

  const deleteUnit = async (id: string) => {
    if (!supabase) throw new Error("Supabase client not available");
    try {
      const { error: rpcError } = await supabase.functions.invoke('tenant-actions', {
        body: {
          action: 'MANAGE_UOM',
          payload: { operation: 'DELETE', uomData: { id } },
        },
      });
      if (rpcError) throw rpcError;
      removeUnit(id); // Actualización optimista
    } catch (err: any) {
      console.error('Error deleting unit of measure:', err);
      setError(err);
      throw err;
    }
  };

  return { units, isLoading, error, createUnit, updateUnit, deleteUnit, refetch: fetchUnits };
};
