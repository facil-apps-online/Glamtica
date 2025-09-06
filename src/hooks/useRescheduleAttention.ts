import { useMutation, useQueryClient } from "@tanstack/react-query";
import { callTenantAction } from "@/lib/tenantActions";
import { useToast } from "./use-toast";

interface RescheduleAttentionParams {
  attentionId: string;
  newDateTime: Date;
  reason: string;
  fault: string;
}

export const useRescheduleAttention = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      attentionId,
      newDateTime,
      reason,
      fault,
    }: RescheduleAttentionParams) => {
      return callTenantAction("reschedule_attention", {
        p_attention_id: attentionId,
        p_new_datetime: newDateTime.toISOString(),
        p_reason: reason,
        p_fault: fault,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attentions"] });
      queryClient.invalidateQueries({ queryKey: ["attention-dates"] });
      toast({
        title: "Éxito",
        description: "Atención reprogramada correctamente.",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al reprogramar la atención",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};