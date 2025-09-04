import { useMutation, useQueryClient } from "@tanstack/react-query";
import { callTenantAction } from "@/lib/tenantActions";
import { useToast } from "@/hooks/use-toast";

export const useCreateProductTransferRequest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<any, Error, any>({
    mutationFn: (requestData) => callTenantAction('create_product_transfer_request', requestData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product_transfers"] });
      toast({ title: "Solicitud Enviada", description: "La solicitud de traslado ha sido enviada.", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};