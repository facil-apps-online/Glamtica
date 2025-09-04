import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { callTenantAction } from "@/lib/tenantActions";

export type AttentionService = Tables<'attention_services'> & {
  services: Tables<'services'>;
  users: Tables<'users'>;
};

export const useAddAttentionService = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (newService: Omit<Tables<'attention_services'>, 'id' | 'created_at' | 'updated_at' | 'status' | 'service_order'>) => 
      callTenantAction('add_attention_service', { newService }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['attentions'] });
      queryClient.invalidateQueries({ queryKey: ['attention-dates'] });
      toast({ title: "Servicio agregado", description: "El nuevo servicio ha sido agregado a la atención.", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error al agregar servicio", description: error.message, variant: "destructive" });
    },
  });
};