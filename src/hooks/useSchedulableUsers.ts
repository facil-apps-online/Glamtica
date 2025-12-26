import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { invokeTenantAction, TenantUserAssignment } from '@/hooks/useTenantUsers';

interface SchedulableUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  is_active: boolean;
  is_schedulable: boolean;
  avatar_url?: string;
  branch_name?: string | null;
}

export const useSchedulableUsers = (selectedBranchId?: string, options: { onlySchedulable: boolean } = { onlySchedulable: false }) => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;
  const userRole = currentAssignment?.role_name;

  return useQuery<SchedulableUser[], Error>({
    queryKey: ['schedulable-users', tenantId, selectedBranchId, userRole, options.onlySchedulable],
    queryFn: async () => {
      if (!tenantId) return [];

      const allAssignments: TenantUserAssignment[] = await invokeTenantAction('get_users_for_tenant', { tenantId });
      
      const assignmentsToProcess = options.onlySchedulable
        ? allAssignments.filter(a => a.is_schedulable)
        : allAssignments;

      const schedulableUsersMap = new Map<string, SchedulableUser>();

      assignmentsToProcess.forEach(assignment => {
        if (assignment.status === 'active') {
          let user = schedulableUsersMap.get(assignment.user_id);
          if (!user) {
            user = {
              id: assignment.user_id,
              first_name: assignment.first_name,
              last_name: assignment.last_name,
              email: assignment.email,
              is_active: true,
              is_schedulable: assignment.is_schedulable,
              avatar_url: assignment.avatar_url || null,
              branch_name: assignment.branch_name || null,
            };
            schedulableUsersMap.set(assignment.user_id, user);
          } else {
            if (assignment.is_schedulable) {
              user.is_schedulable = true;
            }
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