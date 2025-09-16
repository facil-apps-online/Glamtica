import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTenantAction } from '@/lib/fetchTenantAction';

const deletePaymentMethod = async (id: string) => {
  const data = await fetchTenantAction('delete_payment_method', { id });
  return data;
};

export const useDeletePaymentMethod = (tenantId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment_methods'] });
    },
  });
};