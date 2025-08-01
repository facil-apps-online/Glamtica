import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface Role {
  id: string;
  name: string;
  display_name: string;
}

const fetchRoles = async (): Promise<Role[]> => {
  const { data, error } = await supabase
    .from('roles')
    .select('id, name, display_name')
    .like('name', 'tenant_%');

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

export const useRoles = () => {
  return useQuery<Role[], Error>({
    queryKey: ['roles'],
    queryFn: fetchRoles,
  });
};
