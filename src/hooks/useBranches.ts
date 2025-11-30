import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

export interface Branch {
  id: string;
  tenant_id: string;
  name: string;
  address: string | null;
  created_at: string;
  updated_at: string;
  language_code: string | null;
  currency_id: string | null;
  timezone: string | null;
  is_main_branch: boolean;
  status: 'active' | 'pending_activation' | 'archived';
  activated_at: string | null;
  contact_phone?: string | null;
  whatsapp_phone?: string | null;
  commercial_email?: string | null;
  website?: string | null;
  physical_address_line1?: string | null;
  physical_address_line2?: string | null;
  physical_city?: string | null;
  physical_state?: string | null;
  physical_postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  google_place_id?: string | null;
}

// GET branches by calling the RPC function
export const useBranches = (tenantIdParam?: string, activeOnly = false) => {
  const { session, currentAssignment } = useAuth();
  const tenantId = tenantIdParam || currentAssignment?.tenant_id;

  return useQuery<Branch[], Error>({
    queryKey: ['branches', tenantId, activeOnly],
    queryFn: async () => {
      if (!tenantId) return [];
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'get_branches',
          payload: { tenantId: tenantId },
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Failed to fetch branches');
      }
      
      // FIX: The API returns the array directly, not in a 'data' property.
      const branches = Array.isArray(json) ? json as Branch[] : [];
      
      if (activeOnly) {
        return branches.filter(branch => branch.status === 'active');
      }
      
      return branches;
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// CREATE a branch using RPC
export const useCreateBranch = (tenantIdParam?: string) => {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const tenantId = tenantIdParam || (session?.user?.app_metadata?.tenant_id);

  return useMutation({
    mutationFn: async (vars: {
      p_name: string;
      p_address?: string | null;
      p_contact_phone?: string | null;
      p_whatsapp_phone?: string | null;
      p_commercial_email?: string | null;
      p_website?: string | null;
      p_physical_address_line1?: string | null;
      p_physical_address_line2?: string | null;
      p_physical_city?: string | null;
      p_physical_state?: string | null;
      p_physical_postal_code?: string | null;
      p_latitude?: number | null;
      p_longitude?: number | null;
      p_timezone?: string | null;
      p_google_place_id?: string | null;
    }) => {
      if (!tenantId) throw new Error("Tenant ID not available");
      if (!session) throw new Error("Session not available");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'create_branch',
          payload: { ...vars, p_tenant_id: tenantId },
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to create branch');
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches', tenantId] });
    },
  });
};

// UPDATE a branch using RPC
export const useUpdateBranch = (tenantIdParam?: string) => {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const tenantId = tenantIdParam || (session?.user?.app_metadata?.tenant_id);

  return useMutation({
    mutationFn: async (vars: {
      p_branch_id: string;
      p_name: string;
      p_address?: string | null;
      p_contact_phone?: string | null;
      p_whatsapp_phone?: string | null;
      p_commercial_email?: string | null;
      p_website?: string | null;
      p_physical_address_line1?: string | null;
      p_physical_address_line2?: string | null;
      p_physical_city?: string | null;
      p_physical_state?: string | null;
      p_physical_postal_code?: string | null;
      p_latitude?: number | null;
      p_longitude?: number | null;
      p_timezone?: string | null;
      p_google_place_id?: string | null;
    }) => {
      if (!tenantId) throw new Error("Tenant ID not available");
      if (!session) throw new Error("Session not available");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'update_branch',
          payload: vars,
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to update branch');
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches', tenantId] });
    },
  });
};

// DELETE a branch using RPC
export const useDeleteBranch = (tenantIdParam?: string) => {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const tenantId = tenantIdParam || (session?.user?.app_metadata?.tenant_id);

  return useMutation({
    mutationFn: async (p_branch_id: string) => {
      if (!tenantId) throw new Error("Tenant ID not available");
      if (!session) throw new Error("Session not available");

      const { data, error } = await supabase.functions.invoke('tenant-actions', {
        body: {
          action: 'delete-branch',
          payload: { p_branch_id },
        },
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches', tenantId] });
    },
  });
};



// ARCHIVE a branch using RPC
export const useArchiveBranch = (tenantIdParam?: string) => {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const tenantId = tenantIdParam || (session?.user?.app_metadata?.tenant_id);

  return useMutation({
    mutationFn: async (p_branch_id: string) => {
      if (!tenantId) throw new Error("Tenant ID not available");
      if (!session) throw new Error("Session not available");

      const { data, error } = await supabase.functions.invoke('tenant-actions', {
        body: {
          action: 'archive-branch',
          payload: { p_branch_id },
        },
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches', tenantId] });
    },
  });
};

// ACTIVATE a batch of branches using RPC
export const useActivateBranchesBatch = (tenantIdParam?: string) => {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const tenantId = tenantIdParam || (session?.user?.app_metadata?.tenant_id);

  return useMutation({
    mutationFn: async (p_branch_ids: string[]) => {
      if (!tenantId) throw new Error("Tenant ID not available");
      if (!p_branch_ids || p_branch_ids.length === 0) {
        throw new Error("No branch IDs provided for batch activation.");
      }
      if (!session) throw new Error("Session not available");

      const { data, error } = await supabase.functions.invoke('tenant-actions', {
        body: {
          action: 'activate-branches-batch',
          payload: { p_branch_ids },
        },
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches', tenantId] });
    },
  });
};

// CALCULATE prorated cost for a batch of branches
export const useCalculateBatchProration = (tenantIdParam: string, branchIds: string[], options: { enabled: boolean }) => {
  const { session } = useAuth();
  const tenantId = tenantIdParam || (session?.user?.app_metadata?.tenant_id);

  return useQuery({
    queryKey: ['batchProration', tenantId, branchIds],
    queryFn: async () => {
      if (!tenantId || !branchIds || branchIds.length === 0) return null;
      if (!session) throw new Error("Session not available");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'calculate_batch_activation_proration',
          payload: { branchIds: branchIds },
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Failed to calculate proration');
      }
      
      return json;
    },
    enabled: options.enabled && !!tenantId && branchIds.length > 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
};
