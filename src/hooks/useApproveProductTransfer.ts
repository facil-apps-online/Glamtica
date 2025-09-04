import { useMutation, useQueryClient } from "@tanstack/react-query";
import { callTenantAction } from "@/lib/tenantActions";
import { useToast } from "@/hooks/use-toast";

export const useApproveProductTransfer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<any, Error, { transfer_id: string, adjusted_items: any[] }>({
    mutationFn: (payload) => callTenantAction('approve_product_transfer', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product_transfers"] });
      toast({ title: "Traslado Aprobado", description: "El traslado ha sido aprobado.", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};