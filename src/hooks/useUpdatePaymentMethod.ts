import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTenantAction } from '@/lib/fetchTenantAction';

interface UpdatePaymentMethodPayload {
  id: string;
  name: string;
  is_active: boolean;
  requires_evidence: boolean;
}

const updatePaymentMethod = async (payload: UpdatePaymentMethodPayload) => {
  const data = await fetchTenantAction('update_payment_method', payload);
  return data;
};

export const useUpdatePaymentMethod = (tenantId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment_methods'] });
    },
  });
};