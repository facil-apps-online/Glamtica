import { supabase } from "./supabaseClient";

export async function fetchTenantAction(action: string, payload: any = {}) {
  const { data, error } = await supabase.functions.invoke('tenant-actions', {
    body: { action, payload },
  });

  if (error) {
    console.error(`Error invoking tenant-actions function for action ${action}:`, error);
    throw new Error(error.message);
  }

  if (data.error) {
    console.error(`Error from tenant-actions function for action ${action}:`, data.error);
    throw new Error(data.error);
  }

  return data;
}
