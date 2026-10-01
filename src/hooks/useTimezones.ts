
import { useQuery } from '@tanstack/react-query';
import { fetchTenantAction } from '@/lib/fetchTenantAction';

export interface Timezone {
  id: string;
  name: string;
  offset_str: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// timezones vive en Core: se lee a través de tenant-actions.
const fetchTimezones = async (): Promise<Timezone[]> => fetchTenantAction('get_timezones');

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
