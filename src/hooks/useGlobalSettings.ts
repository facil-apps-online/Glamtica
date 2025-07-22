import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface GlobalSettings {
  id: number;
  base_currency_id: string | null;
  default_tax_rate: number | null;
  default_tax_name: string | null;
  company_name: string | null;
  contact_email: string | null;
  address: string | null;
  trial_duration_days: number | null;
  updated_at: string;
}

// GET the single row of global settings
const fetchGlobalSettings = async (): Promise<GlobalSettings> => {
  const { data, error } = await supabase
    .from('global_settings')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const useGlobalSettings = () => {
  return useQuery<GlobalSettings, Error>({
    queryKey: ['global_settings'],
    queryFn: fetchGlobalSettings,
  });
};

// UPDATE the single row of global settings
const updateGlobalSettings = async (settings: Partial<Omit<GlobalSettings, 'id' | 'updated_at'>>): Promise<GlobalSettings> => {
  const { data, error } = await supabase
    .from('global_settings')
    .update(settings)
    .eq('id', 1)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const useUpdateGlobalSettings = () => {
  const queryClient = useQueryClient();
  return useMutation<GlobalSettings, Error, Partial<Omit<GlobalSettings, 'id' | 'updated_at'>>>({
    mutationFn: updateGlobalSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global_settings'] });
    },
  });
};