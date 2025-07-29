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
}

// GET branches by calling the RPC function
export const useBranches = (tenantIdParam?: string) => {
  const { session } = useAuth(); // Use session which is more generic
  const tenantId = tenantIdParam || (session?.user?.app_metadata?.tenant_id);

  return useQuery<Branch[], Error>({
    queryKey: ['branches', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase.rpc('get_tenant_branches', { p_tenant_id: tenantId });
      if (error) throw new Error(error.message);
      return data as Branch[];
    },
    enabled: !!tenantId,
  });
};

// CREATE a branch using RPC
export const useCreateBranch = (tenantIdParam?: string) => {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const tenantId = tenantIdParam || (session?.user?.app_metadata?.tenant_id);

  return useMutation({
    mutationFn: async (vars: { p_name: string; p_address?: string }) => {
      if (!tenantId) throw new Error("Tenant ID not available");
      const { data, error } = await supabase.rpc('create_branch', { p_tenant_id: tenantId, ...vars });
      if (error) throw new Error(error.message);
      return data;
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
    mutationFn: async (vars: { p_branch_id: string; p_name: string; p_address: string }) => {
      if (!tenantId) throw new Error("Tenant ID not available");
      const { data, error } = await supabase.rpc('update_branch', { p_tenant_id: tenantId, ...vars });
      if (error) throw new Error(error.message);
      return data;
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
      const { data, error } = await supabase.rpc('delete_branch', { p_tenant_id: tenantId, p_branch_id });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches', tenantId] });
    },
  });
};

// ACTIVATE a branch using RPC
export const useActivateBranch = (tenantIdParam?: string) => {
    const queryClient = useQueryClient();
    const { session } = useAuth();
    const tenantId = tenantIdParam || (session?.user?.app_metadata?.tenant_id);
  
    return useMutation({
      mutationFn: async (p_branch_id: string) => {
        if (!tenantId) throw new Error("Tenant ID not available");
        const { data, error } = await supabase.rpc('activate_branch', { 
          p_tenant_id: tenantId, 
          p_branch_id: p_branch_id 
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
      const { data, error } = await supabase.rpc('archive_branch', { p_tenant_id: tenantId, p_branch_id });
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
      const { data, error } = await supabase.rpc('activate_branches_batch', { 
        p_tenant_id: tenantId, 
        p_branch_ids: p_branch_ids 
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
      const { data, error } = await supabase.rpc('calculate_batch_activation_proration', {
        p_tenant_id: tenantId,
        p_branch_ids: branchIds,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: options.enabled && !!tenantId && branchIds.length > 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
};
