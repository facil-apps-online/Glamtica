import { useQuery } from '@tanstack/react-query';
import { CommissionFilters } from './useEarnedCommissions';
import { invokeTenantAction } from './useTenantUsers';

export interface Payslip {
  id: string;
  payslip_date: string;
  total_amount: number;
  status: 'pending_signature' | 'paid';
  user: {
    full_name: string;
  };
  branch: {
    name: string;
  };
  // Add other fields as needed
}

export const usePayslips = (filters: CommissionFilters) => {
  return useQuery<Payslip[], Error>({
    queryKey: ['payslips', filters],
    queryFn: () => invokeTenantAction('get_payslips', { filters }),
  });
};
