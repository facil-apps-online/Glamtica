import { supabase } from "./supabaseClient";

export async function fetchTenantAction(action: string, payload: any = {}) {
  const { data, error } = await supabase.functions.invoke('tenant-actions', {
    body: { action, payload },
  });

  if (error) {
    console.error(`Error invoking tenant-actions function for action ${action}:`, error);
    throw new Error(error.message);
  }

  // Si no hay datos o hay un error en los datos, lanzar una excepción
  if (!data || data.error) {
    const errorMessage = data?.error || `La acción '${action}' no devolvió datos.`;
    console.error(`Error from tenant-actions function for action ${action}:`, errorMessage);
    throw new Error(errorMessage);
  }

  return data;
}
