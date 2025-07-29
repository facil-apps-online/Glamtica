import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Platform } from './useSuperadminTenants'; // Re-using the interface from useTenants

const fetchPlatforms = async (): Promise<Platform[]> => {
  const { data, error } = await supabase.functions.invoke('superadmin-actions', {
    body: { action: 'get_platforms' },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const usePlatforms = () => {
  return useQuery<Platform[], Error>({
    queryKey: ['platforms'],
    queryFn: fetchPlatforms,
  });
};
