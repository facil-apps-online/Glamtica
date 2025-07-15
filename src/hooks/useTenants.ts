import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface Tenant {
  id: string;
  name: string;
  subscription_status: string;
  default_language_code: string;
  default_currency_id: string;
  default_timezone: string;
  created_at: string;
  updated_at: string;
  country_id?: string | null;
  countries?: { name: string } | null;

  legal_name?: string | null;
  tax_id?: string | null;
  billing_address?: string | null;
  website?: string | null;
  contact_phone?: string | null;
  whatsapp_phone?: string | null;
  commercial_email?: string | null;
  einvoicing_email?: string | null;
  physical_address_line1?: string | null;
  physical_address_line2?: string | null;
  physical_city?: string | null;
  physical_state?: string | null;
  physical_postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface TenantFilters {
  searchTerm?: string;
}

// GET all tenants with filters
const fetchTenants = async (filters: TenantFilters): Promise<Tenant[]> => {
  let query = supabase
    .from('tenants')
    .select(`
      *,
      countries ( name )
    `);

  if (filters.searchTerm) {
    const searchTerm = `%${filters.searchTerm}%`;
    query = query.or(
      `name.ilike.${searchTerm},legal_name.ilike.${searchTerm},commercial_email.ilike.${searchTerm},tax_id.ilike.${searchTerm}`
    );
  }

  query = query.order('name', { ascending: true });

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const useTenants = (filters: TenantFilters = {}) => {
  return useQuery<Tenant[], Error>({
    queryKey: ['tenants', filters],
    queryFn: () => fetchTenants(filters),
  });
};

// GET tenant by ID
const fetchTenantById = async (tenantId: string): Promise<Tenant> => {
    const { data, error } = await supabase
      .from('tenants')
      .select(`
        *,
        countries ( name )
      `)
      .eq('id', tenantId)
      .single();
  
    if (error) {
      throw new Error(error.message);
    }
  
    return data;
  };
  
  export const useTenantById = (tenantId: string) => {
    return useQuery<Tenant, Error>({
      queryKey: ['tenant', tenantId],
      queryFn: () => fetchTenantById(tenantId),
      enabled: !!tenantId,
    });
  };

// UPDATE tenant
const updateTenant = async ({ tenantId, values }: { tenantId: string, values: Partial<Tenant> }): Promise<Tenant> => {
    const { data, error } = await supabase
      .from('tenants')
      .update(values)
      .eq('id', tenantId)
      .select()
      .single();
  
    if (error) {
      throw new Error(error.message);
    }
  
    return data;
  };
  
  export const useUpdateTenant = () => {
    const queryClient = useQueryClient();
    return useMutation<Tenant, Error, { tenantId: string, values: Partial<Tenant> }>({
      mutationFn: updateTenant,
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['tenants'] });
        queryClient.invalidateQueries({ queryKey: ['tenant', data.id] });
      },
    });
  };

// DELETE tenant
const deleteTenant = async (tenantId: string): Promise<void> => {
    const { error } = await supabase.rpc('delete_tenant_cascade', {
      target_tenant_id: tenantId,
    });
  
    if (error) {
      throw new Error(error.message);
    }
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