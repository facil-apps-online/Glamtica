import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

interface UpdateAttentionStatusVariables {
  attentionId: string;
  newStatus: 'Finalizada' | 'Pagada';
}

export const useUpdateAttentionStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ attentionId, newStatus }: UpdateAttentionStatusVariables) => {
      const { error } = await supabase.rpc('update_attention_status', {
        p_attention_id: attentionId,
        p_new_status: newStatus,
      });

      if (error) {
        throw new Error(`Error updating attention status: ${error.message}`);
      }

      return true;
    },
    onSuccess: (_, variables) => {
      // Invalidate all queries related to attentions to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['attentions'] });
      
      toast({
        title: "Atención Actualizada",
        description: `La atención ha sido marcada como "${variables.newStatus}".`,
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      console.error(error);
    },
  });
};
