import { useMutation, useQueryClient } from "@tanstack/react-query";
import { callTenantAction } from "@/lib/tenantActions";
import { useToast } from "@/hooks/use-toast";

export const useCancelProductTransfer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<any, Error, { transfer_id: string }>({
    mutationFn: (payload) => callTenantAction('cancel_product_transfer', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product_transfers"] });
      toast({ title: "Traslado Cancelado", description: "El traslado ha sido cancelado.", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};