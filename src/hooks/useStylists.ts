
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useSettings } from "@/hooks/useSettings";

export const useStylists = () => {
  const { data: settings } = useSettings();
  return useQuery({
    queryKey: ['stylists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stylists')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!settings
  });
};

export const useActiveStylists = () => {
  const { data: settings } = useSettings();
  return useQuery({
    queryKey: ['stylists', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stylists')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!settings
  });
};
