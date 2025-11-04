import { useQuery } from '@tanstack/react-query';
import { invokeTenantAction } from './useTenantUsers';

export const usePayslipEvidence = (payslipId?: string) => {
  return useQuery({
    queryKey: ['payslip-evidence', payslipId],
    queryFn: async () => {
      if (!payslipId) return null;
      return invokeTenantAction('get_payslip_evidence', { payslip_id: payslipId });
    },
    enabled: !!payslipId,
  });
};
