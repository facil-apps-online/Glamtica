import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface Tenant {
  id: string;
  name: string;
  subscription_status: string;
  created_at: string;
  updated_at: string;
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
  countries?: { name: string } | null; // Mantenemos esta estructura para la UI
}

interface TenantFilters {
  searchTerm?: string;
}

// GET all tenants with filters
const fetchTenants = async (filters: TenantFilters): Promise<Tenant[]> => {
  const { data, error } = await supabase.rpc('get_tenants_with_metrics', {
    search_term_param: filters.searchTerm || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  // La RPC devuelve `country_name`, pero la interfaz `Tenant` espera `countries: { name: string }`
  // Mapeamos la respuesta para que coincida con la interfaz esperada.
  return data.map(tenant => ({
    ...tenant,
    countries: tenant.country_name ? { name: tenant.country_name } : null,
  }));
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