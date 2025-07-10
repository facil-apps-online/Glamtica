
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useServiceCategories = () => {
  return useQuery({
    queryKey: ['service-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      return data as ServiceCategory[];
    },
  });
};

export const useActiveServiceCategories = () => {
  return useQuery({
    queryKey: ['service-categories', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        throw error;
      }

      return data as ServiceCategory[];
    },
  });
};

export const useCreateServiceCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (categoryData: {
      name: string;
      description?: string;
      is_active?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('service_categories')
        .insert([categoryData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-categories'] });
      toast({
        title: "Categoría creada",
        description: "La categoría ha sido creada exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear la categoría. Inténtalo de nuevo.",
        variant: "destructive",
      });
      console.error('Error creating service category:', error);
    },
  });
};

export const useUpdateServiceCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<ServiceCategory> 
    }) => {
      const { data, error } = await supabase
        .from('service_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-categories'] });
      toast({
        title: "Categoría actualizada",
        description: "La categoría ha sido actualizada exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la categoría. Inténtalo de nuevo.",
        variant: "destructive",
      });
      console.error('Error updating service category:', error);
    },
  });
};

export const useToggleServiceCategoryStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('service_categories')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['service-categories'] });
      toast({
        title: data.is_active ? "Categoría activada" : "Categoría desactivada",
        description: `La categoría ha sido ${data.is_active ? 'activada' : 'desactivada'} exitosamente.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado de la categoría. Inténtalo de nuevo.",
        variant: "destructive",
      });
      console.error('Error toggling service category status:', error);
    },
  });
};
