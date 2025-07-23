import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Sha256 } from 'https://deno.land/std@0.160.0/hash/sha256.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
};

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
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

    const webhookBody = await req.json();
    const { data, event, signature, timestamp } = webhookBody;

    if (!data || !event || !signature || !timestamp) {
      throw new Error('Webhook inválido: faltan campos esenciales.');
    }

    const transaction = data.transaction;
    const { reference, currency, expires_at, amount_in_cents } = transaction;
    const amountInCents = amount_in_cents;

    const referenceParts = reference.split('_');
    if (referenceParts.length < 3 || referenceParts[0] !== 'glamtica') {
      throw new Error(`Referencia inválida: no se pudo extraer el tenantId de "${reference}".`);
    }
    const payingTenantId = referenceParts[1];

    const { data: ownerTenant, error: ownerError } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('is_system_owner', true)
      .single();

    if (ownerError) throw new Error(`Error al buscar el tenant propietario: ${ownerError.message}`);
    if (!ownerTenant) throw new Error('No se ha configurado un tenant como propietario del sistema.');

    const { data: activeIntegration, error: integrationError } = await supabaseAdmin
      .from('tenant_integrations')
      .select('encrypted_credentials, nonce, environment')
      .eq('tenant_id', ownerTenant.id)
      .eq('provider', 'wompi-co')
      .eq('is_active', true)
      .single();

    if (integrationError) throw new Error(`No se encontró una configuración de Wompi activa para el tenant propietario.`);

    const { data: decryptedResponse, error: decryptError } = await supabaseAdmin.functions.invoke(
      'decrypt-secret',
      { body: { encryptedData: activeIntegration.encrypted_credentials, iv: activeIntegration.nonce } }
    );
    if (decryptError) throw new Error(`Error al desencriptar credenciales: ${decryptError.message}`);
    const credentials = JSON.parse(decryptedResponse.decryptedText);
    const { events_secret } = credentials;
    const trimmedEventsSecret = events_secret.trim();

    if (!trimmedEventsSecret) throw new Error('El "secreto de eventos" no está configurado en la integración activa.');

    // 3. Verificar la firma del evento
    const properties = signature.properties || [];
    const concatenatedProperties = properties
      .map((prop: string) => getNestedValue(data, prop))
      .join('');

    const messageToSign = `${concatenatedProperties}${timestamp}${trimmedEventsSecret}`;

    const encoder = new TextEncoder();
    const encodedData = encoder.encode(messageToSign);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encodedData);
    const calculatedSignature = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (calculatedSignature !== signature.checksum) {
      throw new Error('Firma del webhook inválida.');
    }

    // 4. Guardar el pago en la base de datos
    const { data: payment, error: saveError } = await supabaseAdmin
      .from('payments')
      .insert({
        tenant_id: payingTenantId,
        provider: 'wompi-co',
        provider_payment_id: transaction.id,
        amount_in_cents: transaction.amount_in_cents,
        currency: transaction.currency,
        status: transaction.status,
        reference: transaction.reference,
        environment: activeIntegration.environment,
        full_response: webhookBody,
        payment_date: transaction.created_at,
      })
      .select('id')
      .single();

    if (saveError && saveError.code !== '23505') { // Ignorar error de duplicado
      throw new Error(`Error al guardar el pago: ${saveError.message}`);
    }

    // 5. Procesar lógica de negocio basada en el estado del pago
    const { data: intent, error: intentError } = await supabaseAdmin
      .from('payment_intents')
      .select('id, metadata')
      .eq('reference', transaction.reference)
      .eq('environment', activeIntegration.environment) // <-- Búsqueda por entorno
      .single();

    if (intentError) {
      console.warn(`[Webhook] No se encontró un intento de pago para la referencia: ${transaction.reference} en el entorno ${activeIntegration.environment}`);
      // Aunque no se encuentre el intent, el pago se registró, por lo que devolvemos éxito.
      return new Response(JSON.stringify({ success: true, warning: 'Payment recorded, but intent not found.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    let newIntentStatus;
    if (transaction.status === 'APPROVED') {
      newIntentStatus = 'COMPLETED';
    } else if (['DECLINED', 'ERROR', 'VOIDED'].includes(transaction.status)) {
      newIntentStatus = 'FAILED';
    } else {
      // Para otros estados como 'PENDING', no hacemos nada y esperamos la resolución final.
      console.log(`[Webhook] Estado de transacción '${transaction.status}' recibido para la referencia ${transaction.reference}. No se requiere acción inmediata.`);
      return new Response(JSON.stringify({ success: true, message: 'Pending status, no action taken.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const { error: updateError } = await supabaseAdmin
      .from('payment_intents')
      .update({ status: newIntentStatus })
      .eq('id', intent.id);

    if (updateError) {
      throw new Error(`Error al actualizar el estado del intento de pago a '${newIntentStatus}': ${updateError.message}`);
    }

    // Si el pago fue aprobado y es una suscripción, activarla.
    if (newIntentStatus === 'COMPLETED' && intent.metadata?.type === 'SUBSCRIPTION_PAYMENT' && payment) {
      const { plan_price_id } = intent.metadata;
      const { error: rpcError } = await supabaseAdmin.rpc('activate_subscription', {
        p_tenant_id: payingTenantId,
        p_plan_price_id: plan_price_id,
        p_payment_id: payment.id,
      });

      if (rpcError) {
        console.error(`[Webhook] Fallo al activar la suscripción para el tenant ${payingTenantId}:`, rpcError);
        // La activación falló, pero el pago y el intent se procesaron.
        // Se podría encolar un reintento o notificar a un administrador.
      } else {
        console.log(`[Webhook] Suscripción activada exitosamente para el tenant ${payingTenantId}.`);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error en el manejador de webhooks de Wompi:', error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
