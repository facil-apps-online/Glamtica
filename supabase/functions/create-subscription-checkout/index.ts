import { serve } from 'https://deno.land/std@0.204.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Sha256 } from 'https://deno.land/std@0.160.0/hash/sha256.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { tenantId, planId, redirectUrl } = await req.json();
    if (!tenantId || !planId || !redirectUrl) {
      throw new Error('tenantId, planId y redirectUrl son requeridos.');
    }

    // 1. Obtener el precio activo más reciente para el plan seleccionado
    const { data: priceData, error: priceError } = await supabaseAdmin
      .from('plan_price_history')
      .select('id, base_price_cop')
      .eq('subscription_plan_id', planId)
      .lte('effective_date', new Date().toISOString())
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    if (priceError) throw new Error(`Error al obtener el precio del plan: ${priceError.message}`);
    if (!priceData) throw new Error(`No se encontró un precio activo para el plan ${planId}.`);

    const amountInCents = priceData.base_price_cop * 100;
    const currency = 'COP'; // Asumiendo COP, ya que el precio base está en COP
    const planPriceId = priceData.id; // Este es el ID del registro de precio

    // 2. Crear el intento de pago (Payment Intent)
    const reference = `glamtica_${tenantId}_${Date.now()}`;
    const { data: intent, error: intentError } = await supabaseAdmin
      .from('payment_intents')
      .insert({
        tenant_id: tenantId,
        status: 'PENDING',
        amount_in_cents: amountInCents,
        currency: currency,
        reference: reference,
        metadata: {
          type: 'SUBSCRIPTION_RENEWAL',
          plan_price_id: planPriceId, // Guardamos el ID del precio específico
        },
      })
      .select()
      .single();

    if (intentError) throw new Error(`Error al crear el intento de pago: ${intentError.message}`);

    // 3. Obtener las credenciales de Wompi y generar la firma (lógica similar a la anterior)
    const { data: tenantData, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('integrations_mode')
      .eq('id', tenantId)
      .single();
    if (tenantError) throw new Error(`Error al obtener el tenant: ${tenantError.message}`);
    const environment = tenantData.integrations_mode === 'test' ? 'test' : 'production';

    const { data: integration, error: integrationError } = await supabaseAdmin
      .from('tenant_integrations')
      .select('encrypted_credentials, nonce')
      .eq('tenant_id', tenantId)
      .eq('provider', 'wompi-co')
      .eq('environment', environment)
      .single();
    if (integrationError) throw new Error(`No se encontró la configuración de Wompi para el entorno ${environment}.`);

    const { data: decryptedResponse, error: decryptError } = await supabaseAdmin.functions.invoke(
      'decrypt-secret',
      { body: { encryptedData: integration.encrypted_credentials, iv: integration.nonce } }
    );
    if (decryptError) throw new Error(`Error al desencriptar credenciales: ${decryptError.message}`);
    const credentials = JSON.parse(decryptedResponse.decryptedText);
    const { public_key, integrity_secret } = credentials;

    const concatenation = `${reference}${amountInCents}${currency}${integrity_secret}`;
    const signature = new Sha256().update(concatenation).hex();

    // 4. Devolver los datos para el formulario de checkout
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
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});