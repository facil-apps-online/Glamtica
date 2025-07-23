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

    // 1. Obtener la configuración de Wompi del tenant propietario.
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

    // 2. Obtener el precio del plan y el precio por sucursal extra.
    const { data: priceData, error: priceError } = await supabaseAdmin
      .from('plan_price_history')
      .select('id, base_price_cop, extra_branch_price_cop')
      .eq('subscription_plan_id', planId)
      .lte('effective_date', new Date().toISOString())
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();
    if (priceError) throw new Error(`Error al obtener el precio del plan: ${priceError.message}`);
    if (!priceData) throw new Error(`No se encontró un precio activo para el plan ${planId}.`);

    const basePrice = priceData.base_price_cop;
    const extraBranchPrice = priceData.extra_branch_price_cop;
    const planPriceId = priceData.id;

    // 3. Contar las sucursales existentes del tenant.
    const { count: branchCount, error: countError } = await supabaseAdmin
      .from('branches')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);
    if (countError) throw new Error(`Error al contar las sucursales: ${countError.message}`);

    // 4. Calcular el costo total.
    const extraBranches = Math.max(0, (branchCount ?? 0) - 1);
    const totalAmount = basePrice + (extraBranches * extraBranchPrice);
    const amountInCents = totalAmount * 100;
    const currency = 'COP';

    // 5. Crear el intento de pago con el monto total calculado.
    const reference = `glamtica_${tenantId}_${Date.now()}`;
    const { data: intent, error: intentError } = await supabaseAdmin
      .from('payment_intents')
      .insert({
        tenant_id: tenantId,
        status: 'PENDING',
        amount_in_cents: amountInCents,
        currency: currency,
        reference: reference,
        environment: integration.environment,
        metadata: { 
          type: 'SUBSCRIPTION_PAYMENT', 
          plan_price_id: planPriceId,
          base_price: basePrice,
          extra_branches: extraBranches,
          extra_branch_price: extraBranchPrice,
          total_amount: totalAmount
        },
      })
      .select()
      .single();
    if (intentError) throw new Error(`Error al crear el intento de pago: ${intentError.message}`);

    // 6. Desencriptar credenciales y generar firma.
    const { data: decryptedResponse, error: decryptError } = await supabaseAdmin.functions.invoke(
      'decrypt-secret',
      { body: { encryptedData: integration.encrypted_credentials, iv: integration.nonce } }
    );
    if (decryptError) throw new Error(`Error al desencriptar credenciales: ${decryptError.message}`);
    const credentials = JSON.parse(decryptedResponse.decryptedText);
    const { public_key, integrity_secret } = credentials;

    const concatenation = `${reference}${amountInCents}${currency}${integrity_secret}`;
    const signature = new Sha256().update(concatenation).hex();

    // 7. Devolver datos para el checkout.
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
    console.error('Error en create-subscription-checkout:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});