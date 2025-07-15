
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface ErrorLog {
  id: string;
  tenant_id: string | null;
  user_id: string | null;
  error_message: string;
  stack_trace: string | null;
  error_code: string | null;
  severity: 'info' | 'warning' | 'error' | 'critical';
  created_at: string;
}

const fetchErrorLogs = async (): Promise<ErrorLog[]> => {
  const { data, error } = await supabase
    .from('error_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const useErrorReports = () => {
  return useQuery<ErrorLog[], Error>({
    queryKey: ['error_reports'],
    queryFn: fetchErrorLogs,
  });
};
