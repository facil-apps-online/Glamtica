import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

// Generic action invoker
export const invokeTenantAction = async (action: string, payload: any) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Session not available for tenant action.");

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action, payload }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
    throw new Error(errorData.error || `Failed to invoke action: ${action}`);
  }

  return response.json();
};


// Hook to get users
export interface TenantUser {
  user_id: string;
  full_name: string;
  email: string;
  role_name: string;
  branch_name: string;
}

export const useTenantUsers = () => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery<TenantUser[], Error>({
    queryKey: ['tenant_users', tenantId],
    queryFn: () => {
      if (!tenantId) return [];
      return invokeTenantAction('get_users_for_tenant', { tenantId });
    },
    enabled: !!tenantId,
  });
};
