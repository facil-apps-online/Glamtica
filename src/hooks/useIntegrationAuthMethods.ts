import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface IntegrationAuthMethod {
  id: string;
  method: string;
  description?: string;
  config_schema?: any;
}

const fetchIntegrationAuthMethods = async (): Promise<IntegrationAuthMethod[]> => {
  const { data, error } = await supabase
    .from('integration_auth_methods')
    .select('*')
    .order('method', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const useIntegrationAuthMethods = () => {
  return useQuery<IntegrationAuthMethod[], Error>({
    queryKey: ['integrationAuthMethods'],
    queryFn: fetchIntegrationAuthMethods,
  });
};
