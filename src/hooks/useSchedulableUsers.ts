import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { invokeTenantAction, TenantUserAssignment } from '@/hooks/useTenantUsers';

interface SchedulableUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  is_active: boolean;
  avatar_url?: string;
  branch_name?: string | null;
}

export const useSchedulableUsers = (selectedBranchId?: string) => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;
  const userRole = currentAssignment?.role_name;

  return useQuery<SchedulableUser[], Error>({
    queryKey: ['schedulable-users', tenantId, selectedBranchId, userRole],
    queryFn: async () => {
      if (!tenantId) return [];

      const allAssignments: TenantUserAssignment[] = await invokeTenantAction('get_users_for_tenant', { tenantId });

      const schedulableUsersMap = new Map<string, SchedulableUser>();

      allAssignments.forEach(assignment => {
        if (assignment.status === 'active') {
          if (!schedulableUsersMap.has(assignment.user_id)) {
            schedulableUsersMap.set(assignment.user_id, {
              id: assignment.user_id,
              first_name: assignment.first_name,
              last_name: assignment.last_name,
              email: assignment.email,
              is_active: true,
              avatar_url: assignment.avatar_url || null,
              branch_name: assignment.branch_name || null,
            });
          }
          const existingUser = schedulableUsersMap.get(assignment.user_id);
          if (existingUser && !existingUser.is_active) {
            existingUser.is_active = true;
          }
        }
      });

      let filteredUsers = Array.from(schedulableUsersMap.values());

      if (selectedBranchId && selectedBranchId !== 'all') {
        filteredUsers = filteredUsers.filter(user =>
          allAssignments.some(assignment =>
            assignment.user_id === user.id &&
            assignment.branch_id === selectedBranchId &&
            assignment.status === 'active'
          )
        );
      }

      return filteredUsers;
    },
    enabled: !!tenantId,
  });
};