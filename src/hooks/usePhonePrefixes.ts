import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface PhonePrefix {
  id: string;
  country_name: string;
  iso_code: string;
  prefix: string;
}

export const usePhonePrefixes = () => {
  return useQuery<PhonePrefix[], Error>({
    queryKey: ['phone_prefixes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phone_prefixes')
        .select('*')
        .order('country_name', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
};
