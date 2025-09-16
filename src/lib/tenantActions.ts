import { supabase } from "@/lib/supabaseClient";

export const callTenantAction = async (action: string, payload: any) => {
  const { data, error } = await supabase.functions.invoke('tenant-actions', {
    body: { action, payload },
  });
  if (error) {
    console.error('callTenantAction: Error al invocar Edge Function \'tenant-actions\'');
    throw error;
  }
  return data;
};