import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { create, getNumericDate } from 'https://deno.land/x/djwt@v2.2/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log('--- [generate-jwt] Invoked ---');
  
  try {
    const jwtSecretExists = Deno.env.get('JWT_SECRET') !== undefined;
    console.log(`--- [generate-jwt] JWT_SECRET found in environment: ${jwtSecretExists} ---`);

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }
    
    const { 
      user_id, 
      email, 
      role, 
      tenant_id, 
      branch_id, 
      first_name, 
      last_name, 
      avatar_url,
      country_id,
      language_id,
      currency_id,
      timezone_id
    } = await req.json();

    const jwt_secret = Deno.env.get('JWT_SECRET')
    if (!jwt_secret) {
      throw new Error('JWT_SECRET is not set in Supabase environment variables.')
    }

    let final_tenant_id = tenant_id;
    if (role === 'super_admin') {
      final_tenant_id = '00000000-0000-0000-0000-000000000000';
    }

    const payload = {
      sub: user_id,
      iss: 'supabase', // <-- AÑADIR ESTA LÍNEA
      email: email,
      tenant_id: final_tenant_id,
      branch_id: branch_id,
      first_name: first_name,
      last_name: last_name,
      avatar_url: avatar_url,
      country_id: country_id,
      language_id: language_id,
      currency_id: currency_id,
      timezone_id: timezone_id,
      aud: 'authenticated',
      exp: getNumericDate(60 * 60 * 24),
      app_metadata: {
        role: role,
      },
    };

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(jwt_secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );

    const token = await create({ alg: "HS256", typ: "JWT" }, payload, key);

    return new Response(
      JSON.stringify({ token }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
