import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

interface Translation {
  id: string;
  key: string; // e.g., "common.welcome"
  lang: string; // e.g., "en", "es"
  value: string; // The translated text
  tenant_id: string;
  branch_id?: string; // Optional, if translations can be branch-specific
  created_at: string;
  updated_at: string;
}

export const useTranslationsAdmin = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all translations
  const fetchTranslations = () => {
    return useQuery({
      queryKey: ['translations'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('translations')
          .select('*')
          .order('key')
          .order('lang');

        if (error) {
          throw error;
        }
        return data as Translation[];
      },
    });
  };

  // Add a new translation
  const addTranslation = useMutation({
    mutationFn: async (newTranslation: Omit<Translation, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('translations')
        .insert(newTranslation)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['translations'] });
      toast({
        title: "Traducción añadida",
        description: "La nueva traducción se ha guardado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo añadir la traducción.",
        variant: "destructive",
      });
      console.error('Error adding translation:', error);
    },
  });

  // Update an existing translation
  const updateTranslation = useMutation({
    mutationFn: async (updatedTranslation: Partial<Translation> & { id: string }) => {
      const { data, error } = await supabase
        .from('translations')
        .update(updatedTranslation)
        .eq('id', updatedTranslation.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['translations'] });
      toast({
        title: "Traducción actualizada",
        description: "Los cambios en la traducción se han guardado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la traducción.",
        variant: "destructive",
      });
      console.error('Error updating translation:', error);
    },
  });

  // Delete a translation
  const deleteTranslation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('translations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['translations'] });
      toast({
        title: "Traducción eliminada",
        description: "La traducción se ha eliminado correctamente.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la traducción.",
        variant: "destructive",
      });
      console.error('Error deleting translation:', error);
    },
  });

  return {
    fetchTranslations,
    addTranslation,
    updateTranslation,
    deleteTranslation,
  };
};