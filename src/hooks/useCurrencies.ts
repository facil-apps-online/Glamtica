import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/hooks/use-toast';

// Interface para el objeto Currency, incluyendo los nuevos campos de formato
export interface Currency {
  id: string;
  name: string;
  code: string;
  symbol: string;
  symbol_position: 'before' | 'after';
  decimal_separator: string;
  thousands_separator: string;
  decimal_places: number;
  is_active: boolean;
}

// Hook para obtener todas las monedas
export const useCurrencies = () => {
  return useQuery<Currency[], Error>({
    queryKey: ['currencies'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/public-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get-currencies',
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.message || 'Failed to fetch currencies');
      }
      return json;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

// Hook para crear una nueva moneda
export const useCreateCurrency = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newCurrency: Omit<Currency, 'id' | 'is_active'>) => {
      const { data, error } = await supabase.from('currencies').insert(newCurrency).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      toast({ title: 'Éxito', description: 'Moneda creada correctamente.', variant: 'success' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

// Hook para actualizar una moneda
export const useUpdateCurrency = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updatedCurrency: Partial<Currency> & { id: string }) => {
      const { id, ...updateData } = updatedCurrency;
      const { data, error } = await supabase.from('currencies').update(updateData).eq('id', id);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      toast({ title: 'Éxito', description: 'Moneda actualizada correctamente.', variant: 'success' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

// Hook para eliminar una moneda
export const useDeleteCurrency = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from('currencies').delete().eq('id', id);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      toast({ title: 'Éxito', description: 'Moneda eliminada correctamente.', variant: 'success' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: "No se puede eliminar una moneda que está en uso.", variant: 'destructive' });
    },
  });
};