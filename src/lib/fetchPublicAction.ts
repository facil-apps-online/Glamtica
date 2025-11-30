import { supabase } from "./supabaseClient";

export async function fetchPublicAction(action: string, payload: any = {}) {
  const { data, error } = await supabase.functions.invoke('public-actions', {
    body: { action, payload },
  });

  if (error) {
    console.error(`Error invoking public-actions function for action ${action}:`, error);
    throw new Error(error.message);
  }

  // If there's an error in the returned data, throw an exception
  if (data && data.error) {
    const errorMessage = data.error || `Action '${action}' returned an error.`;
    console.error(`Error from public-actions function for action ${action}:`, errorMessage);
    throw new Error(errorMessage);
  }
  
  if (data && data.success === false) {
    const errorMessage = data.message || `Action '${action}' failed.`;
    console.error(`Error from public-actions function for action ${action}:`, errorMessage);
    throw new Error(errorMessage);
  }


  return data;
}
