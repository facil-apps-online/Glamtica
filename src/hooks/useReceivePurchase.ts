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

interface ReceivePurchasePayload {
  purchase_id: string;
  branch_id: string;
  received_items: { 
    purchase_item_id: string;
    product_id: string;
    quantity_expected: number;
    quantity_received: number;
  }[];
  reception_notes?: string;
}

export const useReceivePurchase = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useMutation<any, Error, ReceivePurchasePayload>({
    mutationFn: (payload) => callTenantAction('receive_purchase', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['branch_products'] });
      toast({ title: "Compra Recibida", description: "El stock ha sido actualizado exitosamente.", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "Error al Recibir", description: error.message, variant: "destructive" });
    },
  });
};
