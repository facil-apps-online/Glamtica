import { useMutation, useQueryClient } from "@tanstack/react-query";
import { callTenantAction } from "@/lib/tenantActions";
import { useToast } from "@/hooks/use-toast";

export const useCreateProductTransfer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<any, Error, any>({
    mutationFn: (transferData) => callTenantAction('create_product_transfer', transferData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product_transfers'] });
      toast({ title: "Traslado Creado", description: "El traslado ha sido registrado exitosamente.", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};