import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
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

    const { tenantId, amountInCents, currency = 'COP', redirectUrl } = await req.json();
    if (!tenantId || !amountInCents || !redirectUrl) {
      throw new Error('tenantId, amountInCents y redirectUrl son requeridos.');
    }

    // 1. Obtener el modo de integración del tenant
    const { data: tenantData, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('integrations_mode')
      .eq('id', tenantId)
      .single();

    if (tenantError) throw new Error(`Error al obtener el tenant: ${tenantError.message}`);
    const environment = tenantData.integrations_mode === 'test' ? 'test' : 'production';

    // 2. Obtener las credenciales de Wompi para el entorno correcto
    const { data: integration, error: integrationError } = await supabaseAdmin
      .from('tenant_integrations')
      .select('encrypted_credentials, nonce')
      .eq('tenant_id', tenantId)
      .eq('provider', 'wompi-co') // Usando el slug correcto
      .eq('environment', environment)
      .single();

    if (integrationError) throw new Error(`No se encontró la configuración de Wompi para el entorno ${environment}.`);
    if (!integration.encrypted_credentials || !integration.nonce) {
      throw new Error('Las credenciales de la integración están incompletas.');
    }

    // 3. Desencriptar las credenciales
    const { data: decryptedResponse, error: decryptError } = await supabaseAdmin.functions.invoke(
      'decrypt-secret',
      { body: { encryptedData: integration.encrypted_credentials, iv: integration.nonce } }
    );
    if (decryptError) throw new Error(`Error al invocar decrypt-secret: ${decryptError.message}`);
    const credentials = JSON.parse(decryptedResponse.decryptedText);
    const { public_key, integrity_secret } = credentials;

    if (!public_key || !integrity_secret) {
      throw new Error('Las credenciales desencriptadas no contienen public_key o integrity_secret.');
    }

    // 4. Generar la firma de integridad
    const reference = `glamtica_${tenantId}_${Date.now()}`;
    const concatenation = `${reference}${amountInCents}${currency}${integrity_secret}`;
    const signature = new Sha256().update(concatenation).hex();

    // 5. Devolver los datos para el formulario de checkout
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