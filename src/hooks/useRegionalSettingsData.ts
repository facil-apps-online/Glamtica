import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Country, Localization } from './useLocalization';
import { Currency } from './useCurrencies';

export interface RegionalSettingsData {
  countries: Country[];
  localizations: Localization[];
  currencies: Currency[];
}

const fetchRegionalSettingsData = async (): Promise<RegionalSettingsData> => {
  const { data, error } = await supabase.functions.invoke('tenant-actions', {
    body: JSON.stringify({ action: 'get_regional_settings_data' }),
  });

  if (error) {
    console.error('Error fetching regional settings data from Edge Function:', error);
    throw new Error(error.message);
  }

  const { countries, localizations, currencies } = data;

  return {
    countries: countries,
    localizations: localizations,
    currencies: currencies,
  };
};

export const useRegionalSettingsData = () => {
  return useQuery<RegionalSettingsData, Error>({
    queryKey: ['regionalSettingsData'],
    queryFn: fetchRegionalSettingsData,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};
