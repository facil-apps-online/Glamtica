import { useMutation, useQueryClient } from "@tanstack/react-query";
import { callTenantAction } from "@/lib/tenantActions";
import { useToast } from "@/hooks/use-toast";

export const useReceiveProductTransfer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<any, Error, { transfer_id: string, reception_notes?: string, received_items: any[] }>({
    mutationFn: (payload) => callTenantAction('receive_product_transfer', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product_transfers"] });
      toast({ title: "Traslado Recibido", description: "La recepción del traslado ha sido registrada.", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};