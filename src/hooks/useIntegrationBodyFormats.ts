import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface IntegrationBodyFormat {
  id: string;
  format: string;
  description?: string;
}

const fetchIntegrationBodyFormats = async (): Promise<IntegrationBodyFormat[]> => {
  const { data, error } = await supabase
    .from('integration_body_formats')
    .select('*')
    .order('format', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const useIntegrationBodyFormats = () => {
  return useQuery<IntegrationBodyFormat[], Error>({
    queryKey: ['integrationBodyFormats'],
    queryFn: fetchIntegrationBodyFormats,
  });
};
