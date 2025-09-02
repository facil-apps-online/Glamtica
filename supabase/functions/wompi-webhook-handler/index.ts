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
    console.log('[Webhook] Webhook handler started.');
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const webhookBody = await req.json();
    const { data, event, signature, timestamp } = webhookBody;
    console.log('[Webhook] Webhook body parsed.', { event, reference: webhookBody.data?.transaction?.reference });

    if (!data || !event || !signature || !timestamp) {
      console.error('[Webhook] Invalid webhook: missing essential fields.', { data: !!data, event: !!event, signature: !!signature, timestamp: !!timestamp });
      throw new Error('Webhook inválido: faltan campos esenciales.');
    }
    console.log('[Webhook] Essential webhook fields present.');

    const transaction = data.transaction;
    const { reference } = transaction;

    const referenceParts = reference.split('_');
    if (referenceParts.length < 3 || referenceParts[0] !== 'glamtica') {
      throw new Error(`Referencia inválida: no se pudo extraer el tenantId de "${reference}".`);
    }
    const payingTenantId = referenceParts[1];
    console.log('[Webhook] Extracted payingTenantId:', payingTenantId);

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
      console.error(`[Webhook] Error saving payment record: ${saveError.message}`, saveError);
      throw new Error(`Error al guardar el pago: ${saveError.message}`);
    }
    console.log('[Webhook] Payment record saved or already exists.', { paymentId: payment?.id });

    // --- Process Business Logic based on Payment Intent ---
    const { data: intent, error: intentError } = await supabaseAdmin
      .from('payment_intents')
      .select('id, actions_on_success') // Select the new column
      .eq('reference', transaction.reference)
      .single();

    if (intentError || !intent) {
      console.warn(`[Webhook] No se encontró un intento de pago para la referencia: ${transaction.reference}`, intentError);
      return new Response(JSON.stringify({ success: true, warning: 'Payment recorded, but intent not found.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    console.log('[Webhook] Payment intent found.', { intentId: intent.id, currentStatus: transaction.status });

    let newIntentStatus;
    if (transaction.status === 'APPROVED') {
      newIntentStatus = 'COMPLETED';
    } else if (['DECLINED', 'ERROR', 'VOIDED'].includes(transaction.status)) {
      newIntentStatus = 'FAILED';
    } else if (transaction.status === 'PENDING') {
      newIntentStatus = 'PENDING';
    } else {
      // Default to FAILED for any unhandled status to prevent hanging intents
      newIntentStatus = 'FAILED';
      console.warn(`[Webhook] Unhandled transaction status: ${transaction.status}. Setting intent status to FAILED.`);
    }

    console.log('[Webhook] Determined new intent status:', newIntentStatus);

    const { error: updateError } = await supabaseAdmin
      .from('payment_intents')
      .update({ status: newIntentStatus })
      .eq('id', intent.id);
    console.log('[Webhook] Attempted to update payment intent status to:', newIntentStatus);

    if (updateError) {
      console.error(`[Webhook] Error updating payment intent status: ${updateError.message}`, updateError);
      throw new Error(`Error al actualizar el estado del intento de pago: ${updateError.message}`);
    }
    console.log('[Webhook] Payment intent status updated successfully.');

    // --- Execute Actions on Success ---
    if (newIntentStatus === 'COMPLETED' && intent.actions_on_success) {
      console.log('[Webhook] newIntentStatus is COMPLETED. Actions to process:', JSON.stringify(intent.actions_on_success, null, 2));
      console.log('[Webhook] Processing actions_on_success.', intent.actions_on_success);
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
              console.log('[Webhook] Executing ACTIVATE_SUBSCRIPTION action.', action.payload);
              if (!action.payload?.plan_id) throw new Error('Payload para ACTIVATE_SUBSCRIPTION es inválido.');
              
              // Get the latest tariff_id from price_tariffs for the given plan_id
              // Assuming a default platform_id for now. This might need to be dynamic.
              const { data: planData, error: planError } = await supabaseAdmin
                .from('subscription_plans')
                .select('platform_id')
                .eq('id', action.payload.plan_id)
                .single();

              if (planError) throw new Error(`Error al obtener el platform_id para el plan ${action.payload.plan_id}: ${planError.message}`);
              if (!planData || !planData.platform_id) throw new Error(`No se encontró platform_id para el plan ${action.payload.plan_id}.`);

              const PLATFORM_ID = planData.platform_id;
              console.log('[Webhook] PLATFORM_ID for subscription activation:', PLATFORM_ID);

              const { data: tariffData, error: tariffError } = await supabaseAdmin
                .from('price_tariffs')
                .select('id')
                .eq('subscription_plan_id', action.payload.plan_id)
                .lte('effective_date', new Date().toISOString())
                .order('effective_date', { ascending: false })
                .limit(1)
                .single();

              if (tariffError) {
                console.error(`[Webhook] Error fetching tariff_id for plan ${action.payload.plan_id}: ${tariffError.message}`, tariffError);
                throw new Error(`Error al obtener el tariff_id para el plan ${action.payload.plan_id}: ${tariffError.message}`);
              }
              if (!tariffData) {
                console.error(`[Webhook] No active tariff found for plan ${action.payload.plan_id}.`);
                throw new Error(`No se encontró un precio activo (tariff) para el plan ${action.payload.plan_id}.`);
              }
              console.log('[Webhook] Tariff data found:', tariffData);

              const { error: rpcError } = await supabaseAdmin.rpc('activate_subscription', {
                p_tenant_id: payingTenantId,
                p_plan_price_id: tariffData.id, // Pass the tariff_id as p_plan_price_id
                p_payment_id: payment.id,
              });
              if (rpcError) {
                console.error(`[Webhook] RPC activate_subscription failed: ${rpcError.message}`, rpcError);
                throw new Error(`Fallo en RPC activate_subscription: ${rpcError.message}`);
              }
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
    console.error('[Webhook] Unhandled error in webhook handler:', error.message, error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});