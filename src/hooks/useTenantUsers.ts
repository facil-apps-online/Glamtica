import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

// This interface now matches the detailed structure returned by the final RPC function.
export interface TenantUserAssignment {
  assignment_id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role_id: string | null;
  role_name: string | null;
  role_display_name: string | null;
  branch_id: string | null;
  branch_name: string | null;
  status: string;
}

// Helper function to invoke the superadmin-actions Edge Function
const invokeSuperadminAction = async (action: string, payload?: any) => {
  const { data, error } = await supabase.functions.invoke('superadmin-actions', {
    body: { action, payload },
  });
  if (error) throw new Error(error.message);
  if (data.success === false) {
    throw new Error(data.message);
  }
  return data;
};

// --- GET Users and their Assignments for a Tenant (Superadmin View) ---
const fetchTenantUsers = async (tenantId: string): Promise<TenantUserAssignment[]> => {
  if (!tenantId) return [];
  return invokeSuperadminAction('get_tenant_users', { tenantId });
};

export const useTenantUsers = (tenantId: string) => {
  return useQuery<TenantUserAssignment[], Error>({
    queryKey: ['tenantUsers', tenantId],
    queryFn: () => fetchTenantUsers(tenantId),
    enabled: !!tenantId,
  });
};

// --- UPDATE User Status (Superadmin View) ---
// Note: This logic needs to be updated to modify assignments, not a user's global status.
// This is a placeholder and will likely need a new RPC like 'update_user_assignment_status'.
const updateUserStatus = async (userId: string, isActive: boolean): Promise<any> => {
    const { data, error } = await supabase.rpc('update_user_active_status', {
        target_user_id: userId,
        p_is_active: isActive,
        p_user_role: 'super_admin'
    });

    if (error) throw new Error(error.message);
    return data;
}

export const useUpdateUserStatus = () => {
    const queryClient = useQueryClient();
    return useMutation<any, Error, { userId: string, isActive: boolean, tenantId: string }>({
        mutationFn: ({ userId, isActive }) => updateUserStatus(userId, isActive),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tenantUsers', variables.tenantId] });
        }
    });
}
