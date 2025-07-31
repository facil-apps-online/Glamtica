import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

// Interface for a Tenant, from the perspective of a tenant user.
// It does not include platform information or system owner status.
export interface Tenant {
  id: string;
  name: string;
  subscription_status: string;
  default_language_code?: string | null;
  default_currency_id?: string | null;
  default_timezone?: string | null;
  contact_person?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  country_id?: string | null;
  logo_url?: string | null;
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
  latitude?: number | null;
  longitude?: number | null;
  countries?: { name: string; iso_code: string } | null;
}

// --- React Query Hooks for Tenant Users ---

// GET the current user's tenant data
const fetchTenantById = async (tenantId: string): Promise<Tenant> => {
  const { data, error } = await supabase
    .from('tenants')
    .select(`
      *,
      countries (
        name,
        iso_code
      )
    `)
    .eq('id', tenantId)
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data as Tenant;
};

export const useTenantById = (tenantId: string) => {
  return useQuery<Tenant, Error>({
    queryKey: ['tenant', tenantId],
    queryFn: () => fetchTenantById(tenantId),
    enabled: !!tenantId, // Only run the query if tenantId is available
  });
};

// UPDATE the current user's tenant data
const updateTenant = async ({ id, ...values }: Partial<Tenant> & { id: string }): Promise<Tenant> => {
  const response = await fetch('/functions/v1/tenant-actions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
    body: JSON.stringify({
      action: 'update_tenant',
      payload: { id, values },
    }),
  });

  const { data, error } = await response.json();

  if (error) {
    throw new Error(error.message);
  }
  return data;
};
  
export const useUpdateTenant = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useAuth();

  return useMutation<Tenant, Error, Partial<Tenant> & { id: string }>({
    mutationFn: updateTenant,
    onSuccess: (data) => {
      // Invalidate the query for the current tenant to refetch the updated data
      queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
    },
  });
};
