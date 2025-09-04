import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

const callTenantAction = async (action: string, payload: any) => {
  const { data, error } = await supabase.functions.invoke('tenant-actions', {
    body: { action, payload },
  });
  if (error) throw error;
  return data;
};

interface CancelPurchasePayload {
  purchase_id: string;
}

export const useCancelPurchase = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<any, Error, CancelPurchasePayload>({
    mutationFn: (payload) => callTenantAction('cancel_purchase', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      toast({ title: "Compra Cancelada", description: "La compra ha sido marcada como cancelada.", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "Error al Cancelar", description: error.message, variant: "destructive" });
    },
  });
};
