import { useQuery } from '@tanstack/react-query';
import { invokeTenantAction } from './useTenantUsers';

export const usePayslipCommissionDetails = (payslipId?: string) => {
  return useQuery({
    queryKey: ['payslip-commission-details', payslipId],
    queryFn: async () => {
      if (!payslipId) return null;
      return invokeTenantAction('get_payslip_commission_details', { payslip_id: payslipId });
    },
    enabled: !!payslipId,
  });
};
