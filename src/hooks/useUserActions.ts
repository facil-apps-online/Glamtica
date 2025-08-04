import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

// Helper function to invoke the user-actions Edge Function
export const invokeUserAction = async (action: string, payload?: any) => {
  const { data, error } = await supabase.functions.invoke('user-actions', {
    body: { action, payload },
  });
  if (error) throw new Error(error.message);
  // The user-actions function might return a specific success payload or just a success message
  if (data.success === false) {
    throw new Error(data.message || 'An unknown error occurred in user action.');
  }
  return data;
};

// --- CREATE Password Reset Token ---
// This mutation will call the 'generate-recovery-token' action in the 'user-actions' Edge Function.
interface CreatePasswordResetTokenPayload {
  email: string;
  platform_id: string;
}

const createPasswordResetToken = async (payload: CreatePasswordResetTokenPayload): Promise<any> => {
  return invokeUserAction('generate-recovery-token', payload);
};

export const useCreatePasswordResetToken = () => {
  return useMutation<any, Error, CreatePasswordResetTokenPayload>({
    mutationFn: createPasswordResetToken,
  });
};

// --- SET Password with Recovery Token ---
interface SetPasswordPayload {
  token: string;
  newPassword: string;
}

const setPasswordWithToken = async (payload: SetPasswordPayload): Promise<any> => {
  return invokeUserAction('set-password-with-token', payload);
};

export const useSetPasswordWithToken = () => {
  return useMutation<any, Error, SetPasswordPayload>({
    mutationFn: setPasswordWithToken,
  });
};
