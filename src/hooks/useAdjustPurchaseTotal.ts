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

interface AdjustPurchaseTotalPayload {
  purchase_id: string;
}

export const useAdjustPurchaseTotal = () => {
  const { toast } = useToast();

  return useMutation<any, Error, AdjustPurchaseTotalPayload>({
    mutationFn: (payload) => callTenantAction('adjust_purchase_total', payload),
    onSuccess: () => {
      toast({ title: "Total de Compra Ajustado", description: "El monto total ha sido recalculado exitosamente.", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "Error al Ajustar Total", description: error.message, variant: "destructive" });
    },
  });
};