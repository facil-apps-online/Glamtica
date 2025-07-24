import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Sha256 } from 'https://deno.land/std@0.160.0/hash/sha256.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to validate the incoming request
function validateRequest(body: any) {
  const { tenantId, redirectUrl, userId, amountInCents, currency = 'COP', actions_on_success } = body;
  if (!tenantId || !redirectUrl || !userId || amountInCents === undefined) {
    throw new Error('tenantId, redirectUrl, userId y amountInCents son requeridos.');
  }
  if (amountInCents <= 0) {
    throw new Error('El campo "amountInCents" debe ser un número positivo.');
  }
  if (!Array.isArray(actions_on_success) || actions_on_success.length === 0) {
    throw new Error('El campo "actions_on_success" debe ser un array no vacío.');
  }
  return { tenantId, redirectUrl, userId, amountInCents, currency, actions_on_success };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const { tenantId, redirectUrl, userId, amountInCents, currency, actions_on_success } = validateRequest(body);

    // --- CORRECTED: Get Wompi Credentials from the System Owner Tenant ---
    const { data: systemOwnerTenant, error: ownerError } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('is_system_owner', true)
      .single();
    if (ownerError) throw new Error(`Error al buscar el tenant propietario: ${ownerError.message}`);
    if (!systemOwnerTenant) throw new Error('No se ha configurado un tenant como propietario del sistema.');

    const { data: integration, error: integrationError } = await supabaseAdmin
      .from('tenant_integrations')
      .select('encrypted_credentials, nonce, environment')
      .eq('tenant_id', systemOwnerTenant.id)
      .eq('provider', 'wompi-co')
      .eq('is_active', true)
      .single();
    if (integrationError) throw new Error('No se encontró una configuración de Wompi activa para el tenant propietario.');

    const { environment } = integration;

    // --- Decrypt Credentials ---
    const { data: decryptedResponse, error: decryptError } = await supabaseAdmin.functions.invoke('decrypt-secret', { body: { encryptedData: integration.encrypted_credentials, iv: integration.nonce } });
    if (decryptError) throw new Error(`Error al desencriptar credenciales: ${decryptError.message}`);
    const credentials = JSON.parse(decryptedResponse.decryptedText);
    const { public_key, integrity_secret } = credentials;
    if (!public_key || !integrity_secret) throw new Error('Credenciales de Wompi incompletas.');

    // --- Create Payment Intent ---
    const reference = `glamtica_${tenantId}_${Date.now()}`;
    const { error: intentError } = await supabaseAdmin
      .from('payment_intents')
      .insert({
        tenant_id: tenantId,
        status: 'PENDING',
        amount_in_cents: amountInCents,
        currency: currency,
        reference: reference,
        actions_on_success: actions_on_success,
        metadata: { initiated_by: userId },
        environment: environment,
      });
    if (intentError) throw new Error(`Error al crear el intento de pago: ${intentError.message}`);

    // --- Generate Wompi Signature & Checkout Data ---
    const concatenation = `${reference}${amountInCents}${currency}${integrity_secret}`;
    const signature = new Sha256().update(concatenation).hex();

    const checkoutData = {
      'public-key': public_key,
      'currency': currency,
      'amount-in-cents': amountInCents,
      'reference': reference,
      'redirect-url': redirectUrl,
      'signature:integrity': signature,
    };

    return new Response(JSON.stringify({ success: true, checkoutData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error en wompi-generate-checkout:', error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});