
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
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const updateTenantInfo = async (tenant: Partial<TenantInfo>): Promise<TenantInfo> => {
  const { data, error } = await supabase
    .from('tenants')
    .update(tenant)
    .eq('id', tenant.id)
    .single();

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
  return useMutation<TenantInfo, Error, Partial<TenantInfo>>({
    mutationFn: updateTenantInfo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant_info'] });
    },
  });
};
