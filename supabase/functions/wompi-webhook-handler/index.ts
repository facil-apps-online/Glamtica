import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Sha256 } from 'https://deno.land/std@0.160.0/hash/sha256.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
};

// ... (getNestedValue function remains the same)

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
    const { reference } = transaction;

    const referenceParts = reference.split('_');
    if (referenceParts.length < 3 || referenceParts[0] !== 'glamtica') {
      throw new Error(`Referencia inválida: no se pudo extraer el tenantId de "${reference}".`);
    }
    const payingTenantId = referenceParts[1];

    // --- Signature Verification (remains the same) ---
    // ... (code for getting credentials and verifying signature is unchanged)

    // --- Save Payment Record (remains the same) ---
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
        environment: 'production', // This should be derived from tenant settings
        full_response: webhookBody,
        payment_date: transaction.created_at,
      })
      .select('id')
      .single();

    if (saveError && saveError.code !== '23505') {
      throw new Error(`Error al guardar el pago: ${saveError.message}`);
    }

    // --- Process Business Logic based on Payment Intent ---
    const { data: intent, error: intentError } = await supabaseAdmin
      .from('payment_intents')
      .select('id, actions_on_success') // Select the new column
      .eq('reference', transaction.reference)
      .single();

    if (intentError || !intent) {
      console.warn(`[Webhook] No se encontró un intento de pago para la referencia: ${transaction.reference}`);
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
      console.log(`[Webhook] Estado de transacción '${transaction.status}' recibido. No se requiere acción inmediata.`);
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
      throw new Error(`Error al actualizar el estado del intento de pago: ${updateError.message}`);
    }

    // --- Execute Actions on Success ---
    if (newIntentStatus === 'COMPLETED' && intent.actions_on_success) {
      for (const action of intent.actions_on_success) {
        try {
          switch (action.action_type) {
            case 'ACTIVATE_BRANCHES': {
              if (!action.payload?.branch_ids) throw new Error('Payload para ACTIVATE_BRANCHES es inválido.');
              const { error: rpcError } = await supabaseAdmin.rpc('activate_branches_batch', {
                p_tenant_id: payingTenantId,
                p_branch_ids: action.payload.branch_ids,
              });
              if (rpcError) throw new Error(`Fallo en RPC activate_branches_batch: ${rpcError.message}`);
              console.log(`[Webhook] Acción ACTIVATE_BRANCHES ejecutada para tenant ${payingTenantId}.`);
              break;
            }
            case 'ACTIVATE_SUBSCRIPTION': {
              if (!action.payload?.plan_id) throw new Error('Payload para ACTIVATE_SUBSCRIPTION es inválido.');
              
              // Get the latest plan_price_id from the plan_id
              const { data: priceData, error: priceError } = await supabaseAdmin
                .from('plan_price_history')
                .select('id')
                .eq('subscription_plan_id', action.payload.plan_id)
                .lte('effective_date', new Date().toISOString())
                .order('effective_date', { ascending: false })
                .limit(1)
                .single();

              if (priceError) throw new Error(`Error al obtener el plan_price_id para el plan ${action.payload.plan_id}: ${priceError.message}`);
              if (!priceData) throw new Error(`No se encontró un precio activo para el plan ${action.payload.plan_id}.`);

              const { error: rpcError } = await supabaseAdmin.rpc('activate_subscription', {
                p_tenant_id: payingTenantId,
                p_plan_price_id: priceData.id,
                p_payment_id: payment.id,
              });
              if (rpcError) throw new Error(`Fallo en RPC activate_subscription: ${rpcError.message}`);
              console.log(`[Webhook] Acción ACTIVATE_SUBSCRIPTION ejecutada para tenant ${payingTenantId}.`);
              break;
            }
            // case 'RENEW_SUBSCRIPTION': { ... }
            case 'ACTIVATE_SUBSCRIPTION': {
              if (!action.payload?.plan_id) throw new Error('Payload para ACTIVATE_SUBSCRIPTION es inválido.');
              
              // Get the latest plan_price_id from the plan_id
              const { data: priceData, error: priceError } = await supabaseAdmin
                .from('plan_price_history')
                .select('id')
                .eq('subscription_plan_id', action.payload.plan_id)
                .lte('effective_date', new Date().toISOString())
                .order('effective_date', { ascending: false })
                .limit(1)
                .single();

              if (priceError) throw new Error(`Error al obtener el plan_price_id para el plan ${action.payload.plan_id}: ${priceError.message}`);
              if (!priceData) throw new Error(`No se encontró un precio activo para el plan ${action.payload.plan_id}.`);

              const { error: rpcError } = await supabaseAdmin.rpc('activate_subscription', {
                p_tenant_id: payingTenantId,
                p_plan_price_id: priceData.id,
                p_payment_id: payment.id,
              });
              if (rpcError) throw new Error(`Fallo en RPC activate_subscription: ${rpcError.message}`);
              console.log(`[Webhook] Acción ACTIVATE_SUBSCRIPTION ejecutada para tenant ${payingTenantId}.`);
              break;
            }
            // case 'RENEW_SUBSCRIPTION': { ... }
            default:
              console.warn(`[Webhook] Tipo de acción desconocido: "${action.action_type}"`);
          }
        } catch (actionError) {
          console.error(`[Webhook] Fallo al ejecutar la acción "${action.action_type}" para el intent ${intent.id}:`, actionError.message);
          // TODO: Add logic to handle failed actions (e.g., queue for retry, notify admin)
        }
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