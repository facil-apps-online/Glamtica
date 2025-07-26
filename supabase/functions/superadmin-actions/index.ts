import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

console.log("Initializing superadmin-actions function");

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, payload } = await req.json();
    console.log(`superadmin-actions: Received action '${action}'`);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let responseData: any;
    let statusCode = 200;
    const startTime = performance.now();
    let metricsPath = `edge/superadmin-actions/${action}`;

    try {
      switch (action) {
        case 'get_platforms': {
          const { data, error } = await supabaseAdmin.from('platforms').select('*').order('created_at', { ascending: false });
          if (error) {
            statusCode = 500;
            throw error;
          }
          responseData = data;
          break;
        }

        case 'get_platform_by_id': {
          const { id } = payload;
          if (!id) {
            statusCode = 400;
            throw new Error("Platform ID is required.");
          }
          const { data, error } = await supabaseAdmin.from('platforms').select('*').eq('id', id).single();
          if (error) {
            statusCode = 404; // Not Found
            throw error;
          }
          responseData = data;
          break;
        }

        case 'create_platform': {
          const { name, description, base_url } = payload;
          if (!name) {
            statusCode = 400;
            throw new Error("Platform name is required.");
          }
          const { data, error } = await supabaseAdmin.from('platforms').insert({ name, description, base_url }).select().single();
          if (error) {
            statusCode = 500;
            throw error;
          }
          responseData = data;
          break;
        }

        case 'update_platform': {
          const { id, data: updateData } = payload;
          if (!id || !updateData) {
            statusCode = 400;
            throw new Error("Platform ID and data are required.");
          }
          const { data, error } = await supabaseAdmin.from('platforms').update(updateData).eq('id', id).select().single();
          if (error) {
            statusCode = 500;
            throw error;
          }
          responseData = data;
          break;
        }

        case 'delete_platform': {
          const { id } = payload;
          if (!id) {
            statusCode = 400;
            throw new Error("Platform ID is required.");
          }
          const { error } = await supabaseAdmin.from('platforms').delete().eq('id', id);
          if (error) {
            statusCode = 500;
            throw error;
          }
          responseData = { success: true, message: 'Platform deleted successfully.' };
          break;
        }

        default:
          statusCode = 400;
          throw new Error(`Invalid action: ${action}`);
      }
    } catch (error) {
      // Si el error no fue manejado, se captura aquí para registrar la métrica
      if (statusCode === 200) statusCode = 500; // Error inesperado
      console.error(`Error in action '${action}':`, error.message);
      responseData = { success: false, message: error.message };
      // Se relanza el error para que sea capturado por el bloque exterior y se envíe la respuesta correcta
      throw error;
    } finally {
      const endTime = performance.now();
      const responseTimeMs = endTime - startTime;
      
      console.log(`superadmin-actions: Action '${action}' took ${responseTimeMs.toFixed(2)}ms, status: ${statusCode}`);

      const { error: metricsError } = await supabaseAdmin.from('api_request_metrics').insert({
        path: metricsPath,
        method: 'POST',
        status_code: statusCode,
        response_time_ms: responseTimeMs
      });

      if (metricsError) {
        console.error("Failed to insert metrics:", metricsError);
      }
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: statusCode,
    });

  } catch (error) {
    // Este bloque captura errores de la lógica principal (ej. JSON malformado) o los errores relanzados desde el switch
    return new Response(JSON.stringify({
      success: false,
      message: error.message,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400, // O el statusCode que se haya definido
    });
  }
});
