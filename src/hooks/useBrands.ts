
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

export interface Brand {
  id: string;
  name: string;
  description?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export const useBrands = () => {
  return useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      return data as Brand[];
    },
  });
};

export const useActiveBrands = () => {
  return useQuery({
    queryKey: ['brands', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        throw error;
      }

      return data as Brand[];
    },
  });
};

export const useCreateBrand = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (brandData: {
      name: string;
      description?: string;
    }) => {
      const { data, error } = await supabase
        .from('brands')
        .insert([brandData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast({
        title: "Marca creada",
        description: "La marca ha sido creada exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear la marca. Inténtalo de nuevo.",
        variant: "destructive",
      });
      console.error('Error creating brand:', error);
    },
  });
};

export const useUpdateBrand = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<Brand> 
    }) => {
      const { data, error } = await supabase
        .from('brands')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast({
        title: "Marca actualizada",
        description: "La marca ha sido actualizada exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la marca. Inténtalo de nuevo.",
        variant: "destructive",
      });
      console.error('Error updating brand:', error);
    },
  });
};
