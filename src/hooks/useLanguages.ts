import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface Language {
  id: string;
  name: string;
  iso_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const fetchLanguages = async (): Promise<Language[]> => {
  const { data, error } = await supabase
    .from('languages')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const useLanguages = () => {
  return useQuery<Language[], Error>({
    queryKey: ['languages'],
    queryFn: fetchLanguages,
  });
};
