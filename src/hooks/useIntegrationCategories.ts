import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

export interface IntegrationCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

// Hook para obtener todas las categorías (usando .from())
export const useIntegrationCategories = () => {
  return useQuery<IntegrationCategory[], Error>({
    queryKey: ['integrationCategories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_categories')
        .select('*')
        .order('name');
      if (error) throw new Error(error.message);
      return data;
    },
  });
};

// Hook para crear/actualizar una categoría (usando .upsert())
export const useUpsertIntegrationCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (category: Partial<IntegrationCategory>) => {
      const { data, error } = await supabase
        .from('integration_categories')
        .upsert(category)
        .select();
      
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data, variables) => {
      toast({ title: `Categoría ${variables.id ? 'actualizada' : 'creada'} con éxito.`, variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['integrationCategories'] });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

// Hook para eliminar una categoría (usando .delete())
export const useDeleteIntegrationCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('integration_categories')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast({ title: 'Categoría eliminada con éxito.', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['integrationCategories'] });
    },
    onError: (error) => {
      // Personalizamos el mensaje de error para el caso de llave foránea
      if (error.message.includes('violates foreign key constraint')) {
        toast({ title: 'Error al eliminar', description: 'No se puede eliminar la categoría porque está siendo utilizada por uno o más proveedores.', variant: 'destructive' });
      } else {
        toast({ title: 'Error al eliminar', description: error.message, variant: 'destructive' });
      }
    },
  });
};