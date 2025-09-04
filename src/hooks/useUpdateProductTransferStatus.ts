import { useMutation, useQueryClient } from "@tanstack/react-query";
import { callTenantAction } from "@/lib/tenantActions";
import { useToast } from "@/hooks/use-toast";

export const useUpdateProductTransferStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<any, Error, any>({
    mutationFn: (transferData) => callTenantAction('update_product_transfer_status', transferData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product_transfers'] });
      toast({ title: "Estado de Traslado Actualizado", description: "El estado del traslado ha sido actualizado exitosamente.", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};