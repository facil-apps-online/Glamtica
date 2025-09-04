
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

export const useServiceSession = (attentionServiceId: string) => {
  return useQuery<Tables<'service_sessions'> | null, Error>({
    queryKey: ['service-session', attentionServiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_sessions')
        .select('*')
        .eq('attention_service_id', attentionServiceId)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116: no rows found
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!attentionServiceId,
  });
};

export const useStartServiceSession = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ attentionServiceId }: { attentionServiceId: string }) => {
      const { error } = await supabase.rpc('start_service', { 
        p_attention_service_id: attentionServiceId 
      });

      if (error) throw new Error(error.message);
    },
    onSuccess: (_, { attentionServiceId }) => {
      queryClient.invalidateQueries({ queryKey: ['service-session', attentionServiceId] });
      queryClient.invalidateQueries({ queryKey: ['attentions'] });
      toast({ title: "Servicio iniciado", description: "La sesión de servicio ha comenzado.", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error al iniciar", description: error.message, variant: "destructive" });
    },
  });
};

export const useEndServiceSession = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ attentionServiceId }: { attentionServiceId: string }) => {
      const { error } = await supabase.rpc('end_service', { 
        p_attention_service_id: attentionServiceId 
      });

      if (error) throw new Error(error.message);
    },
    onSuccess: (_, { attentionServiceId }) => {
      queryClient.invalidateQueries({ queryKey: ['service-session', attentionServiceId] });
      queryClient.invalidateQueries({ queryKey: ['attentions'] });
      toast({ title: "Servicio finalizado", description: "La sesión de servicio ha terminado.", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error al finalizar", description: error.message, variant: "destructive" });
    },
  });
};
