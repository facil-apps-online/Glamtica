import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTenantAction } from '@/lib/fetchTenantAction';

interface CreatePaymentMethodPayload {
  name: string;
  is_active: boolean;
  requires_evidence: boolean;
  tenant_id: string;
}

const createPaymentMethod = async (payload: CreatePaymentMethodPayload) => {
  const data = await fetchTenantAction('create_payment_method', payload);
  return data;
};

export const useCreatePaymentMethod = (tenantId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Omit<CreatePaymentMethodPayload, 'tenant_id'>) => {
      if (!tenantId) {
        return Promise.reject('No tenant ID found');
      }
      return createPaymentMethod({ ...payload, tenant_id: tenantId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment_methods'] });
    },
  });
};