import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const callTenantAction = async (action: string, payload: any) => {
  const { data, error } = await supabase.functions.invoke('tenant-actions', {
    body: { action, payload },
  });
  if (error) throw error;
  return data;
};

interface UpdatePaymentStatusPayload {
  purchase_id: string;
  payment_status: string;
}

export const useUpdatePurchasePaymentStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useMutation<any, Error, UpdatePaymentStatusPayload>({
    mutationFn: (payload) => callTenantAction('update_purchase_payment_status', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases', tenantId] });
      toast({ title: "Estado de Pago Actualizado", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "Error al actualizar pago", description: error.message, variant: "destructive" });
    },
  });
};
