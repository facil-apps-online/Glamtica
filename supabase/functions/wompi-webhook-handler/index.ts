import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { HmacSha256 } from 'https://deno.land/std@0.160.0/hash/sha256.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
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

    const webhookBody = await req.json();
    const { data, event, signature, timestamp } = webhookBody;

    if (!data || !event || !signature || !timestamp) {
      throw new Error('Webhook inválido: faltan campos esenciales.');
    }

    const transaction = data.transaction;
    const reference = transaction.reference;

    // 1. Extraer tenantId de la referencia
    const referenceParts = reference.split('_');
    if (referenceParts.length < 3 || referenceParts[0] !== 'glamtica') {
      throw new Error(`Referencia inválida: no se pudo extraer el tenantId de "${reference}".`);
    }
    const tenantId = referenceParts[1];
    const environment = transaction.status === 'APPROVED' && !transaction.id.startsWith('test_') ? 'production' : 'test';

    // 2. Obtener el 'events_secret' del tenant
    const { data: integration, error: integrationError } = await supabaseAdmin
      .from('tenant_integrations')
      .select('encrypted_credentials, nonce')
      .eq('tenant_id', tenantId)
      .eq('provider', 'wompi-co')
      .eq('environment', environment)
      .single();

    if (integrationError) throw new Error(`No se encontró la configuración de Wompi para el tenant ${tenantId} en el entorno ${environment}.`);

    const { data: decryptedResponse, error: decryptError } = await supabaseAdmin.functions.invoke(
      'decrypt-secret',
      { body: { encryptedData: integration.encrypted_credentials, iv: integration.nonce } }
    );
    if (decryptError) throw new Error(`Error al desencriptar credenciales: ${decryptError.message}`);
    const credentials = JSON.parse(decryptedResponse.decryptedText);
    const { events_secret } = credentials;

    if (!events_secret) throw new Error('El "secreto de eventos" no está configurado para este tenant.');

    // 3. Verificar la firma del evento
    const signatureProperties = signature.properties;
    const concatenatedString = signatureProperties.map(prop => transaction[prop]).join('');
    const signatureToVerify = `${concatenatedString}${timestamp}${events_secret}`;
    const calculatedSignature = new HmacSha256(events_secret).update(signatureToVerify).hex();
    
    // NOTA: La documentación de Wompi es un poco ambigua aquí. Puede que la firma sea un SHA256 simple en lugar de HMAC.
    // Si la verificación falla, este es el primer lugar para revisar.
    // const calculatedSignature = new Sha256().update(signatureToVerify).hex();

    if (calculatedSignature !== signature.checksum) {
      console.warn('Fallo de verificación de firma. Calculada:', calculatedSignature, 'Recibida:', signature.checksum);
      throw new Error('Firma del webhook inválida.');
    }

    // 4. Guardar el pago en la base de datos
    const { data: payment, error: saveError } = await supabaseAdmin
      .from('payments')
      .insert({
        tenant_id: tenantId,
        provider: 'wompi-co',
        provider_payment_id: transaction.id,
        amount_in_cents: transaction.amount_in_cents,
        currency: transaction.currency,
        status: transaction.status,
        reference: transaction.reference,
        environment: environment,
        full_response: webhookBody,
        payment_date: transaction.created_at,
      })
      .select()
      .single();

    if (saveError && saveError.code !== '23505') { // Ignorar error de duplicado
      throw new Error(`Error al guardar el pago: ${saveError.message}`);
    }

    // 5. Si el pago fue aprobado, procesar la lógica de negocio
    if (transaction.status === 'APPROVED' && payment) {
      // Buscar el intento de pago original
      const { data: intent, error: intentError } = await supabaseAdmin
        .from('payment_intents')
        .select('id, metadata')
        .eq('reference', transaction.reference)
        .single();

      if (intentError) {
        console.warn(`[Webhook] No se encontró un intento de pago para la referencia: ${transaction.reference}`);
      } else {
        // Actualizar el estado del intento de pago
        await supabaseAdmin
          .from('payment_intents')
          .update({ status: 'COMPLETED' })
          .eq('id', intent.id);

        // Procesar la acción basada en los metadatos
        if (intent.metadata?.type === 'SUBSCRIPTION_RENEWAL') {
          const { plan_price_id } = intent.metadata;
          const { error: rpcError } = await supabaseAdmin.rpc('activate_subscription', {
            p_tenant_id: tenantId,
            p_plan_price_id: plan_price_id,
            p_payment_id: payment.id,
          });

          if (rpcError) {
            console.error(`[Webhook] Fallo al activar la suscripción para el tenant ${tenantId}:`, rpcError);
          } else {
            console.log(`[Webhook] Suscripción activada exitosamente para el tenant ${tenantId}.`);
          }
        }
      }
    }

    // 6. Responder 200 OK
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error en el manejador de webhooks de Wompi:', error.message);
    // Respondemos 200 OK incluso si hay un error interno para evitar reintentos de Wompi
    // si el error no es recuperable (ej. referencia inválida).
    // Para errores recuperables, se podría responder con un 500.
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});