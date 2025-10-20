import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

console.log("Initializing public-actions function");

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, payload } = await req.json();
    console.log(`public-actions: Received action '${action}'`);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let responseData: any;
    let statusCode = 200;

    try {
      switch (action) {
        case 'UPDATE_TV_PLAYBACK_STATE': {
          const { branch_id, current_playlist_item_id, video_started_at } = payload;
          if (!branch_id || !current_playlist_item_id || !video_started_at) {
            throw new Error('branch_id, current_playlist_item_id, and video_started_at are required for UPDATE_TV_PLAYBACK_STATE.');
          }
    
          const { data, error } = await supabaseAdmin
            .from('branch_playback_state')
            .upsert({
              branch_id: branch_id,
              current_playlist_item_id: current_playlist_item_id,
              video_started_at: video_started_at,
            }, { onConflict: 'branch_id' })
            .select()
            .single();
    
          if (error) throw error;
          responseData = data;
          break;
        }

        case 'GET_PUBLIC_SUBSCRIPTION_PLANS': {
          const { countryId, platformId } = payload;
          if (!countryId || !platformId) {
            throw new Error('countryId and platformId are required.');
          }
          const { data, error } = await supabaseAdmin.rpc('get_public_subscription_plans', {
            p_country_id: countryId,
            p_platform_id: platformId,
          });
          if (error) throw error;
          responseData = data;
          break;
        }

        default:
          statusCode = 400;
          throw new Error(`Invalid action for public-actions: ${action}`);
      }
    } catch (error) {
      statusCode = 500;
      console.error(`Error in public action '${action}':`, error.message);
      responseData = { success: false, message: error.message };
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: statusCode,
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: error.message,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
