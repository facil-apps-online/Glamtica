import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from './use-toast';

interface TenantActionPayload {
  action: string;
  payload?: any;
}

const invokeTenantAction = async ({ action, payload }: TenantActionPayload) => {
  const { data, error } = await supabase.functions.invoke('tenant-actions', {
    body: { action, payload },
  });

  if (error) {
    throw new Error(error.message);
  }

  // The function might return a specific success payload or just a success message
  if (data.success === false) {
    throw new Error(data.message || `An unknown error occurred in action: ${action}.`);
  }

  return data.data;
};

interface UseTenantActionOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

export const useTenantAction = (options: UseTenantActionOptions = {}) => {
  const { toast } = useToast();

  return useMutation<any, Error, TenantActionPayload>({
    mutationFn: invokeTenantAction,
    onSuccess: (data) => {
      if (options.successMessage) {
        toast({
          title: 'Éxito',
          description: options.successMessage,
          variant: 'success',
        });
      }
      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      toast({
        title: options.errorMessage || 'Error',
        description: error.message,
        variant: 'destructive',
      });
      if (options.onError) {
        options.onError(error);
      }
    },
  });
};
