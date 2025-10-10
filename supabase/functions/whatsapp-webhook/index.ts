
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// --- Environment Variables ---
const META_VERIFY_TOKEN = Deno.env.get('META_VERIFY_TOKEN');
const META_APP_SECRET = Deno.env.get('META_APP_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// --- Main Handler ---
serve(async (req) => {
  const url = new URL(req.url);
  const supabaseAdmin = createClient(SUPABASE_URL ?? '', SUPABASE_SERVICE_ROLE_KEY ?? '');

  try {
    // --- 1. Handle Webhook Verification (GET Request) ---
    if (req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      if (mode === 'subscribe' && token === META_VERIFY_TOKEN) {
        console.log('Webhook verified successfully!');
        return new Response(challenge, { status: 200 });
      } else {
        console.error('Webhook verification failed.');
        return new Response('Forbidden', { status: 403 });
      }
    }

    // --- 2. Handle Incoming Messages (POST Request) ---
    if (req.method === 'POST') {
      // --- 2a. Security Validation ---
      const signature = req.headers.get('X-Hub-Signature-256');
      if (!signature) {
        throw new Error('Missing X-Hub-Signature-256 header');
      }

      const body = await req.text();
      const hmac = await crypto.subtle.importKey('raw', new TextEncoder().encode(META_APP_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const digest = await crypto.subtle.sign('HMAC', hmac, new TextEncoder().encode(body));
      const calculatedSignature = `sha256=${Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')}`;

      if (calculatedSignature !== signature) {
        throw new Error('Signature validation failed');
      }

      // --- 2b. Acknowledge receipt immediately ---
      // Meta requires a 200 OK response within seconds.
      // We send it before processing the message.
      setTimeout(async () => {
        try {
          const payload = JSON.parse(body);
          if (payload.object === 'whatsapp_business_account') {
            for (const entry of payload.entry) {
              for (const change of entry.changes) {
                if (change.field === 'messages') {
                  for (const message of change.value.messages) {
                    await processMessage(message, supabaseAdmin);
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error('Error processing message payload:', e);
        }
      }, 0);

      return new Response('OK', { status: 200 });
    }

    // Handle other methods
    return new Response('Method Not Allowed', { status: 405 });

  } catch (error) {
    console.error('Error in webhook:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});

// --- 3. Message Processing Logic ---
async function processMessage(message: any, supabase: any) {
  console.log('Processing message:', JSON.stringify(message));

  // --- Handle Interactive Button Replies ---
  if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
    const buttonId = message.interactive.button_reply.id;
    const [action, token] = buttonId.split('_'); // e.g., 'confirm_TOKEN' or 'cancel_TOKEN'

    if ((action === 'confirm' || action === 'cancel') && token) {
      console.log(`Action: ${action}, Token: ${token}`);
      const updateUrl = `${SUPABASE_URL}/functions/v1/update-attention-status?token=${token}&action=${action}`;
      const response = await fetch(updateUrl);
      if (!response.ok) {
        console.error(`Failed to update attention status for token ${token}. Status: ${response.status}`);
      }
      // You could queue a confirmation reply here if desired.
    }
    return; // End processing for this message type
  }

  // --- Handle Text Messages ---
  if (message.type === 'text') {
    const clientPhone = message.from;

    // 1. Find client by phone number
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, tenant_id')
      .eq('phone', clientPhone)
      .single();

    if (clientError || !client) {
      console.warn(`Client not found for phone number: ${clientPhone}`);
      // Optionally, send a "number not recognized" message.
      return;
    }

    // 2. Find upcoming appointments for the client
    const { data: attentions, error: attentionsError } = await supabase
      .from('attentions')
      .select('attention_datetime')
      .eq('client_id', client.id)
      .in('status', ['Pendiente', 'Confirmada'])
      .gte('attention_datetime', new Date().toISOString())
      .order('attention_datetime', { ascending: true })
      .limit(5);

    if (attentionsError) {
      console.error(`Error fetching attentions for client ${client.id}:`, attentionsError);
      return;
    }

    // 3. Format the reply message
    let replyBody = '';
    if (!attentions || attentions.length === 0) {
      replyBody = 'Hola! No hemos encontrado citas próximas para este número.';
    } else {
      const formattedDates = attentions.map(att => 
        `- ${new Date(att.attention_datetime).toLocaleString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
      ).join('\n');
      replyBody = `Hola! Tus próximas citas son:\n${formattedDates}`;
    }

    // 4. Queue the reply using a generic template
    await supabase.rpc('queue_client_whatsapp', {
      p_tenant_id: client.tenant_id,
      p_client_id: client.id,
      p_template_name: 'generic_text_message', // Assumes a template named 'generic_text_message' exists in Meta with one variable: {{1}}
      p_template_params: {
        parameters: [{ type: 'text', text: replyBody }]
      }
    });
  }
}
