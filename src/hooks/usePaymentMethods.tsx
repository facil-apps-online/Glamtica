import { useQuery } from '@tanstack/react-query';
import { fetchTenantAction } from '@/lib/fetchTenantAction';

export interface PaymentMethod {
  id: string;
  name: string;
  is_active: boolean;
  requires_evidence: boolean;
}

const fetchPaymentMethods = async (tenantId: string): Promise<PaymentMethod[]> => {
  const data = await fetchTenantAction('get_payment_methods', { tenantId });
  return data;
};

export const usePaymentMethods = (tenantId: string | undefined) => {
  return useQuery<PaymentMethod[], Error>({
    queryKey: ['payment_methods', tenantId],
    queryFn: () => fetchPaymentMethods(tenantId!),
    enabled: !!tenantId,
  });
};