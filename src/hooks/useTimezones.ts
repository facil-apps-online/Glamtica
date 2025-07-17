
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface Timezone {
  id: string;
  name: string;
  offset_str: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const fetchTimezones = async (): Promise<Timezone[]> => {
  const { data, error } = await supabase
    .from('timezones')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const useTimezones = () => {
  return useQuery<Timezone[], Error, { id: string; name: string; formattedLabel: string }[]>({
    queryKey: ['timezones'],
    queryFn: fetchTimezones,
    select: (data) =>
      data.map((tz) => ({
        id: tz.id,
        name: tz.name,
        formattedLabel: `(UTC${tz.offset_str}) ${tz.name}`,
      })),
  });
};
