import { useQuery } from '@tanstack/react-query';
import { invokeTenantAction } from './useTenantUsers';
import { useAuth } from '@/contexts/AuthContext';

// Define the interface for a single commission
export interface EarnedCommission {
  id: string;
  created_at: string;
  sale_id: string;
  commission_amount: number;
  status: 'earned' | 'processing' | 'paid' | 'voided';
  user: {
    full_name: string;
  };
  branch: {
    name: string;
  };
  // Add other fields from the select statement as needed
}

// Define the filters interface
export interface CommissionFilters {
  dateRange?: { from?: string; to?: string };
  status?: string;
  userId?: string;
  branchId?: string;
}

export const useEarnedCommissions = (filters: CommissionFilters) => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery<EarnedCommission[], Error>({
    queryKey: ['earned_commissions', filters, tenantId],
    queryFn: () => {
      if (!tenantId) throw new Error("Tenant ID is required.");
      return invokeTenantAction('get_earned_commissions', { filters, tenantId });
    },
    enabled: !!tenantId,
  });
};
