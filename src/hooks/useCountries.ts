import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface Country {
  id: string;
  name: string;
  iso_code: string;
  currency_id: string;
  timezone: string;
  default_language_iso_code: string; // New field
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const fetchCountries = async (): Promise<Country[]> => {
  const { data, error } = await supabase
    .from('countries')
    .select('*, currencies(code, symbol)') // Select currency code and symbol
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const useCountries = () => {
  return useQuery<Country[], Error>({
    queryKey: ['countries'],
    queryFn: fetchCountries,
  });
};
