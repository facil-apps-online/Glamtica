import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Tables } from '@/integrations/supabase/types';
import { callTenantAction } from '@/lib/tenantActions';

export type UserSchedule = Tables<'user_schedules'>;

export const useBranchSchedules = (branchId?: string) => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery<UserSchedule[], Error>({
    queryKey: ['branch-schedules', tenantId, branchId],
    queryFn: async () => {
      if (!tenantId || !branchId || branchId === 'all') return [];
      const data = await callTenantAction('get_schedules_for_branch', {
        branchId,
      });
      return data;
    },
    enabled: !!tenantId && !!branchId && branchId !== 'all',
  });
};
