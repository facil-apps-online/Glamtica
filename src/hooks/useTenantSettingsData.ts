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
  // The tenantId is passed for query key consistency, but the function gets the ID from the JWT
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

  const responseData = await response.json();

  if (!response.ok || responseData.success === false) {
    console.error('Error fetching tenant settings data:', responseData.message);
    throw new Error(responseData.message || 'Failed to fetch tenant settings data');
  }

  return responseData;
};

export const useTenantSettingsData = (tenantId: string) => {
  return useQuery<TenantSettingsData, Error>({
    queryKey: ['tenantSettingsData', tenantId],
    queryFn: () => fetchTenantSettingsData(tenantId),
    enabled: !!tenantId, // Only run the query if tenantId is available
  });
};