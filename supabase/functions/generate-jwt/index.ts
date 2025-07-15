// Import Deno's standard server and the djwt library for signing tokens.
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
// Correctly import the necessary functions from djwt v2.2
import { create, getNumericDate } from 'https://deno.land/x/djwt@v2.2/mod.ts'

// Define CORS headers to allow requests from any origin.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Explicitly allow OPTIONS
}

serve(async (req) => {
  // The browser sends an OPTIONS request first to check if the server allows the actual request.
  // We must handle this preflight request by responding with a 200 OK and the CORS headers.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get all the necessary data from the request body.
    const { 
      user_id, 
      email, 
      role, 
      tenant_id, 
      branch_id, 
      first_name, 
      last_name, 
      avatar_url, 
      jwt_secret 
    } = await req.json()

    console.log('[generate-jwt] Received role:', role);

    // Ensure the JWT secret was passed.
    if (!jwt_secret) {
      throw new Error('JWT secret is missing.')
    }

    // If the user is a super_admin, ensure their tenant_id is the global one.
    let final_tenant_id = tenant_id;
    if (role === 'super_admin') {
      final_tenant_id = '00000000-0000-0000-0000-000000000000';
    }

    // Create the payload for the JWT, including all user data.
    const payload = {
      sub: user_id,
      email: email,
      tenant_id: final_tenant_id, // Use the potentially modified tenant_id
      branch_id: branch_id,
      first_name: first_name,
      last_name: last_name,
      avatar_url: avatar_url, // Add avatar_url to the payload
      aud: 'authenticated', // Add the audience claim
      exp: getNumericDate(60 * 60 * 24), // Token expires in 24 hours
      app_metadata: {
        role: role, // Move role into app_metadata
      },
    };

    console.log('[generate-jwt] Payload before signing:', payload);

    // Prepare the cryptographic key for signing.
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(jwt_secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );

    // Sign the token using the correct syntax for djwt v2.2
    const token = await create({ alg: "HS256", typ: "JWT" }, payload, key);

    // Return the newly generated token.
    return new Response(
      JSON.stringify({ token }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    // Return an error response if anything fails.
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})