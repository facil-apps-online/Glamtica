
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface TenantInfo {
  id: string;
  name: string;
  logo_url: string | null;
  notes: string | null;
  default_language_code: string;
  default_currency_id: string;
  default_timezone: string;
  subscription_status: string;
  created_at: string;
  updated_at: string;
  country_id?: string | null;

  // Nuevos campos
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

const fetchTenantInfo = async (): Promise<TenantInfo> => {
  const response = await fetch('/functions/v1/tenant-actions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
    body: JSON.stringify({
      action: 'get-tenant-details',
    }),
  });

  const { data, error } = await response.json();

  if (error) {
    throw new Error(error.message);
  }

  // Ensure the returned data matches the TenantInfo interface, adapting if necessary
  return data;
};

const updateTenantInfo = async (tenantId: string, updates: Partial<TenantInfo>): Promise<TenantInfo> => {
  const response = await fetch('/functions/v1/tenant-actions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
    body: JSON.stringify({
      action: 'update_tenant',
      payload: { id: tenantId, values: updates },
    }),
  });

  const { data, error } = await response.json();

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

export const useTenantInfo = () => {
  return useQuery<TenantInfo, Error>({
    queryKey: ['tenant_info'],
    queryFn: fetchTenantInfo,
  });
};

export const useUpdateTenantInfo = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useAuth(); // Get tenantId from context

  return useMutation<TenantInfo, Error, Partial<TenantInfo>>({
    mutationFn: async (updates) => {
      if (!tenantId) throw new Error("Tenant ID is required for update.");
      return updateTenantInfo(tenantId, updates); // Pass tenantId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant_info'] });
    },
  });
};
