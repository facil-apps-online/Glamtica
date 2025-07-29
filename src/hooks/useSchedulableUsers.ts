import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

export const useSchedulableUsers = () => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;
  const branchId = currentAssignment?.branch_id;
  const userRole = currentAssignment?.role_name;

  return useQuery({
    queryKey: ['schedulable-users', tenantId, branchId, userRole],
    queryFn: async () => {
      if (!tenantId) return [];

      let query = supabase
        .from('users')
        .select('*')
        .eq('is_schedulable', true);

      // Non-superadmins should only see users from their own tenant and branch
      if (userRole !== 'super_admin') {
        query = query.eq('tenant_id', tenantId).eq('branch_id', branchId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching schedulable users:', error);
        throw new Error(error.message);
      }
      
      return data;
    },
    enabled: !!tenantId,
  });
};
