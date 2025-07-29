import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

// Interface for the Platform object, which is now nested within a Tenant
export interface Platform {
  id: string;
  name: string;
}

// Updated Tenant interface to include the nested platform object
export interface Tenant {
  id: string;
  name: string;
  subscription_status: string;
  created_at: string;
  updated_at: string;
  platform?: Platform | null; // <-- Added platform object
  default_language_code?: string | null;
  default_currency_id?: string | null;
  default_timezone?: string | null;
  contact_person?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  country_id?: string | null;
  is_active?: boolean | null;
  logo_url?: string | null;
  notes?: string | null;
  legal_name?: string | null;
  tax_id?: string | null;
  billing_address?: string | null;
  website?: string | null;
  whatsapp_phone?: string | null;
  commercial_email?: string | null;
  einvoicing_email?: string | null;
  physical_address_line1?: string | null;
  physical_address_line2?: string | null;
  physical_city?: string | null;
  physical_state?: string | null;
  physical_postal_code?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  countries?: { name: string; iso_code: string } | null;
  is_system_owner?: boolean;
}

interface TenantFilters {
  searchTerm?: string;
  platformId?: string;
}

// Helper function to invoke the superadmin-actions Edge Function
const invokeSuperadminAction = async (action: string, payload?: any) => {
  const { data, error } = await supabase.functions.invoke('superadmin-actions', {
    body: { action, payload },
  });
  if (error) throw new Error(error.message);
  return data;
};

// --- React Query Hooks ---

// GET all tenants
const fetchTenants = async (filters: TenantFilters): Promise<Tenant[]> => {
  return invokeSuperadminAction('get_tenants', { 
    searchTerm: filters.searchTerm,
    platformId: filters.platformId 
  });
};

export const useTenants = (filters: TenantFilters = {}) => {
  return useQuery<Tenant[], Error>({
    queryKey: ['tenants', filters],
    queryFn: () => fetchTenants(filters),
  });
};

// GET tenant by ID
const fetchTenantById = async (tenantId: string): Promise<Tenant> => {
  return invokeSuperadminAction('get_tenant_by_id', { id: tenantId });
};

export const useTenantById = (tenantId: string) => {
  return useQuery<Tenant, Error>({
    queryKey: ['tenant', tenantId],
    queryFn: () => fetchTenantById(tenantId),
    enabled: !!tenantId,
  });
};

// CREATE tenant
// The payload for creation is extensive and includes user details for the admin.
// We define a specific type for it.
export type CreateTenantPayload = Omit<Tenant, 'id' | 'created_at' | 'updated_at' | 'platform'> & {
  platform_id: string;
  admin_email: string;
  admin_first_name: string;
  admin_last_name: string;
  admin_phone: string;
};

const createTenant = async (payload: CreateTenantPayload): Promise<any> => {
  return invokeSuperadminAction('create_tenant', payload);
};

export const useCreateTenant = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, CreateTenantPayload>({
    mutationFn: createTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
};


// UPDATE tenant
const updateTenant = async ({ id, ...values }: Partial<Tenant> & { id: string }): Promise<Tenant> => {
    return invokeSuperadminAction('update_tenant', { id, ...values });
};
  
export const useUpdateTenant = () => {
  const queryClient = useQueryClient();
  return useMutation<Tenant, Error, Partial<Tenant> & { id: string }>({
    mutationFn: updateTenant,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', data.id] });
    },
  });
};

// SET system owner
interface SetSystemOwnerPayload {
  tenantId: string;
  platformId: string;
}

const setSystemOwner = async (payload: SetSystemOwnerPayload): Promise<void> => {
  return invokeSuperadminAction('set_system_owner', payload);
};

export const useSetSystemOwner = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, SetSystemOwnerPayload>({
    mutationFn: setSystemOwner,
    onSuccess: () => {
      // Invalidate and refetch all tenants to reflect the change
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
};

// DELETE tenant
const deleteTenant = async (tenantId: string): Promise<void> => {
  return invokeSuperadminAction('delete_tenant', { id: tenantId });
};

export const useDeleteTenant = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
};
