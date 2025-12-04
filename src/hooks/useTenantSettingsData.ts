import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { PublicCountry, PublicLanguage, PublicCurrency } from './usePublicRegistrationData'; // Re-using interfaces

export interface TenantData {
    id: string;
    name: string;
    description: string | null;
    country_id: string | null;
    default_language_code: string | null;
    default_currency_id: string | null;
    default_timezone: string | null;
    contact_phone: string | null;
    whatsapp_phone: string | null;
    commercial_email: string | null;
    legal_name: string | null;
    tax_id: string | null;
    billing_address: string | null;
    einvoicing_email: string | null;
    physical_address_line1: string | null;
    physical_address_line2: string | null;
    physical_city: string | null;
    physical_state: string | null;
    physical_postal_code: string | null;
    website: string | null;
    latitude: number | null;
    longitude: number | null;
}

export interface TenantSettingsData {
  tenant: TenantData;
  countries: PublicCountry[];
  languages: PublicLanguage[];
  currencies: PublicCurrency[];
}

const fetchTenantSettingsData = async (tenantId: string): Promise<TenantSettingsData> => {
  const { data, error } = await supabase.rpc('get_tenant_settings_data', { tenant_id_param: tenantId });

  if (error) {
    console.error('Error fetching tenant settings data:', error);
    throw new Error(error.message);
  }

  return data;
};

export const useTenantSettingsData = (tenantId: string) => {
  return useQuery<TenantSettingsData, Error>({
    queryKey: ['tenantSettingsData', tenantId],
    queryFn: () => fetchTenantSettingsData(tenantId),
    enabled: !!tenantId, // Only run the query if tenantId is available
  });
};