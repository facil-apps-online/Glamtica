import { coreSupabase } from "@/lib/supabaseClient";

export const callCoreAction = async (functionName: string, payload: any) => {
  const { data, error } = await coreSupabase.functions.invoke(functionName, {
    body: payload, // Send the payload directly as the body
  });
  
  if (error) {
    console.error(`callCoreAction: Error invoking Edge Function '${functionName}'`, error);
    throw error;
  }
  
  return data;
};
