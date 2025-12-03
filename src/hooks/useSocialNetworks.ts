import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

// Enum for social network names (must match the PostgreSQL ENUM)
export type SocialNetworkType = 'Instagram' | 'Facebook' | 'X' | 'TikTok' | 'WhatsApp' | 'LinkedIn' | 'YouTube' | 'Website';

// Options for the UI dropdown
export const SOCIAL_NETWORK_OPTIONS: { value: SocialNetworkType; label: string }[] = [
  { value: 'Instagram', label: 'Instagram' },
  { value: 'Facebook', label: 'Facebook' },
  { value: 'X', label: 'X (Twitter)' },
  { value: 'TikTok', label: 'TikTok' },
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'LinkedIn', label: 'LinkedIn' },
  { value: 'YouTube', label: 'YouTube' },
  { value: 'Website', label: 'Sitio Web' },
];

// Base interface for social networks
export interface BaseSocialNetwork {
  id: string;
  network: SocialNetworkType;
  url: string;
  created_at: string;
  updated_at: string;
}

// Tenant Social Network interface
export interface TenantSocialNetwork extends BaseSocialNetwork {
  tenant_id: string;
}

// Branch Social Network interface
export interface BranchSocialNetwork extends BaseSocialNetwork {
  branch_id: string;
}

// --- Tenant Social Networks Hooks ---

export const useTenantSocialNetworks = (tenantIdParam?: string) => {
  const { session, currentAssignment } = useAuth();
  const tenantId = tenantIdParam || currentAssignment?.tenant_id;

  return useQuery<TenantSocialNetwork[], Error>({
    queryKey: ['tenantSocialNetworks', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      if (!session) throw new Error("Session not available.");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'list_tenant_social_networks',
          payload: { p_tenant_id: tenantId },
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to fetch tenant social networks');
      }
      return json as TenantSocialNetwork[];
    },
    enabled: !!tenantId && !!session,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useAddTenantSocialNetwork = (tenantIdParam?: string) => {
  const queryClient = useQueryClient();
  const { session, currentAssignment } = useAuth();
  const tenantId = tenantIdParam || currentAssignment?.tenant_id;

  return useMutation<TenantSocialNetwork, Error, { network: SocialNetworkType; url: string }>({
    mutationFn: async (newSocial: { network: SocialNetworkType; url: string }) => {
      if (!tenantId) throw new Error("Tenant ID not available.");
      if (!session) throw new Error("Session not available.");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'add_tenant_social_network',
          payload: { p_tenant_id: tenantId, ...newSocial },
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to add tenant social network');
      }
      return json as TenantSocialNetwork;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantSocialNetworks', tenantId] });
    },
  });
};

export const useUpdateTenantSocialNetwork = (tenantIdParam?: string) => {
  const queryClient = useQueryClient();
  const { session, currentAssignment } = useAuth();
  const tenantId = tenantIdParam || currentAssignment?.tenant_id;

  return useMutation<TenantSocialNetwork, Error, { id: string; network: SocialNetworkType; url: string }>({
    mutationFn: async (updatedSocial: { id: string; network: SocialNetworkType; url: string }) => {
      if (!tenantId) throw new Error("Tenant ID not available.");
      if (!session) throw new Error("Session not available.");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'update_tenant_social_network',
          payload: { p_tenant_id: tenantId, ...updatedSocial },
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to update tenant social network');
      }
      return json as TenantSocialNetwork;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantSocialNetworks', tenantId] });
    },
  });
};

export const useDeleteTenantSocialNetwork = (tenantIdParam?: string) => {
  const queryClient = useQueryClient();
  const { session, currentAssignment } = useAuth();
  const tenantId = tenantIdParam || currentAssignment?.tenant_id;

  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      if (!tenantId) throw new Error("Tenant ID not available.");
      if (!session) throw new Error("Session not available.");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'delete_tenant_social_network',
          payload: { p_tenant_id: tenantId, id },
        }),
      });

      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error || 'Failed to delete tenant social network');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantSocialNetworks', tenantId] });
    },
  });
};

// --- Branch Social Networks Hooks ---

export const useBranchSocialNetworks = (branchId?: string) => {
  const { session } = useAuth();

  return useQuery<BranchSocialNetwork[], Error>({
    queryKey: ['branchSocialNetworks', branchId],
    queryFn: async () => {
      if (!branchId) return [];
      if (!session) throw new Error("Session not available.");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'list_branch_social_networks',
          payload: { p_branch_id: branchId },
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to fetch branch social networks');
      }
      return json as BranchSocialNetwork[];
    },
    enabled: !!branchId && !!session,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useAddBranchSocialNetwork = (branchIdParam?: string) => {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation<BranchSocialNetwork, Error, { network: SocialNetworkType; url: string }>({
    mutationFn: async (newSocial: { network: SocialNetworkType; url: string }) => {
      if (!branchIdParam) throw new Error("Branch ID not available.");
      if (!session) throw new Error("Session not available.");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'add_branch_social_network',
          payload: { p_branch_id: branchIdParam, ...newSocial },
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to add branch social network');
      }
      return json as BranchSocialNetwork;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branchSocialNetworks', branchIdParam] });
    },
  });
};

export const useUpdateBranchSocialNetwork = (branchIdParam?: string) => {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation<BranchSocialNetwork, Error, { id: string; network: SocialNetworkType; url: string }>({
    mutationFn: async (updatedSocial: { id: string; network: SocialNetworkType; url: string }) => {
      if (!branchIdParam) throw new Error("Branch ID not available.");
      if (!session) throw new Error("Session not available.");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'update_branch_social_network',
          payload: { p_branch_id: branchIdParam, ...updatedSocial },
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to update branch social network');
      }
      return json as BranchSocialNetwork;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branchSocialNetworks', branchIdParam] });
    },
  });
};

export const useDeleteBranchSocialNetwork = (branchIdParam?: string) => {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      if (!branchIdParam) throw new Error("Branch ID not available.");
      if (!session) throw new Error("Session not available.");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'delete_branch_social_network',
          payload: { p_branch_id: branchIdParam, id },
        }),
      });

      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error || 'Failed to delete branch social network');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branchSocialNetworks', branchIdParam] });
    },
  });
};
