import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { useBranchFilterStore } from '@/stores/branchFilterStore';

export interface MonthlyExpenseSummary {
  paid: number;
  pending: number;
  overdue: number;
}

export const useMonthlyExpenseSummary = () => {
  const { currentAssignment, loading: authLoading } = useAuth();
  const { selectedBranchId } = useBranchFilterStore();

  const tenantId = currentAssignment?.tenant_id;
  const roleName = currentAssignment?.role_name;
  const userBranchId = currentAssignment?.branch_id;

  let branchIdToFetch: string | undefined = undefined; // Default for tenant-wide if super admin

  const isSuperAdmin = roleName === 'tenant_super_admin';
  const isAdmin = roleName === 'tenant_admin';

  if (isSuperAdmin) {
    if (selectedBranchId && selectedBranchId !== 'all') {
      branchIdToFetch = selectedBranchId;
    }
  } else if (isAdmin) {
    branchIdToFetch = userBranchId; // Branch admin sees only their assigned branch
  } else {
    // Other roles don't have access, so we won't fetch data
    branchIdToFetch = undefined;
  }

  return useQuery<MonthlyExpenseSummary, Error>({
    queryKey: ['monthlyExpenseSummary', tenantId, branchIdToFetch],
    queryFn: async () => {
      if (!tenantId) {
        throw new Error("Tenant ID not available.");
      }
      if (!isSuperAdmin && !isAdmin) {
        throw new Error('Access denied: Insufficient permissions to view expenses summary.');
      }
      if (isAdmin && !userBranchId) {
        throw new Error('Branch ID not found for tenant_admin.');
      }
      
      const { data, error } = await supabase.functions.invoke('tenant-actions', {
        body: {
          action: 'get_monthly_expense_summary',
          payload: { branchId: branchIdToFetch },
        },
      });

      if (error) {
        throw new Error(error.message);
      }
      // Ensure data has the correct structure, default to zeros if null
      return data || { paid: 0, pending: 0, overdue: 0 };
    },
    enabled: !authLoading && !!tenantId && (isSuperAdmin || isAdmin), // Only enable if tenantId is present and user has permission
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
};
