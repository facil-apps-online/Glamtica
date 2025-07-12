import { serve } from "https://deno.land/std@0.224.0/http/mod.ts";
import { SignJWT } from "https://deno.land/x/jose@v5.2.3/index.ts"; // Full URL for manual deployment

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    });
  }

  if (req.method === "POST") {
    try {
      const { user_id, email, role, tenant_id, branch_id, jwt_secret, audience } = await req.json();

      console.log("Edge Function: Received parameters:", { user_id, email, role, tenant_id, branch_id, jwt_secret: jwt_secret ? "[REDACTED]" : "[MISSING]", audience });

      if (!jwt_secret) {
        return new Response(JSON.stringify({ error: "JWT secret is missing." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
      if (!audience) {
        return new Response(JSON.stringify({ error: "Audience is missing." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      const secret = new TextEncoder().encode(jwt_secret);

      const jwt = await new SignJWT({
        sub: user_id,
        email: email,
        role: role,
        tenant_id: tenant_id,
        branch_id: branch_id,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("1h")
        .setAudience(audience) // Set the audience claim
        .sign(secret);

      return new Response(JSON.stringify({ token: jwt }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
  }

  return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
});