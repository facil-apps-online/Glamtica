import { useQuery } from '@tanstack/react-query';

export interface PhonePrefix {
  id: string;
  country_name: string;
  iso_code: string;
  prefix: string;
}

const fetchPhonePrefixes = async (): Promise<PhonePrefix[]> => {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/public-actions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'get-phone-prefixes',
        }),
    });

    const json = await response.json();
    if (!response.ok) {
        throw new Error(json.message || 'Failed to fetch phone prefixes');
    }
    return json;
};

export const usePhonePrefixes = () => {
  return useQuery<PhonePrefix[], Error>({
    queryKey: ['phone_prefixes'],
    queryFn: fetchPhonePrefixes,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};