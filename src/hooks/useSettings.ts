import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

interface Setting {
  id: string;
  key: string;
  value: string;
  description?: string;
}

export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .order('key');

      if (error) {
        throw error;
      }

      return data as Setting[];
    },
  });
};

export const useUpdateSetting = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { data, error } = await supabase
        .from('settings')
        .upsert({ key, value }, { onConflict: 'key' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: "Configuración actualizada",
        description: "Los cambios se han guardado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración.",
        variant: "destructive",
      });
      console.error('Error updating setting:', error);
    },
  });
};