import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Platform } from './useSuperadminTenants'; // Re-using the interface from useTenants

const fetchPlatforms = async (searchTerm?: string): Promise<Platform[]> => {
  const { data, error } = await supabase.functions.invoke('superadmin-actions', {
    body: { 
      action: 'get_platforms',
      payload: { searchTerm }
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const usePlatforms = (searchTerm?: string) => {
  return useQuery<Platform[], Error>({
    queryKey: ['platforms', searchTerm],
    queryFn: () => fetchPlatforms(searchTerm),
  });
};
