import { supabase } from "@/lib/supabaseClient";

export const callTenantAction = async (action: string, payload: any) => {
  if (action === 'get_available_users') {
    console.log('[get_available_users PAYLOAD]:', JSON.stringify(payload, null, 2));
  }
  const { data, error } = await supabase.functions.invoke('tenant-actions', {
    body: { action, payload },
  });
  if (error) {
    console.error('callTenantAction: Error al invocar Edge Function \'tenant-actions\':', JSON.stringify(error, null, 2));
    throw error;
  }
  console.log('callTenantAction: Edge Function \'tenant-actions\' ejecutada con éxito. Data:', JSON.stringify(data, null, 2));
  return data;
};