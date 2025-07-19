import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Definición de tipos para los datos del formulario que esperamos recibir
interface FormData {
  name: string;
  country_id: string;
  default_language_code: string;
  default_currency_id: string;
  default_timezone: string;
  contact_phone?: string;
  whatsapp_phone?: string;
  commercial_email?: string;
  legal_name?: string;
  tax_id?: string;
  billing_address?: string;
  einvoicing_email?: string;
  physical_address_line1?: string;
  physical_address_line2?: string;
  physical_city?: string;
  physical_state?: string;
  physical_postal_code?: string;
  website?: string;
  latitude: number;
  longitude: number;
  admin_email: string;
  admin_password: string;
  recaptcha_token: string;
}

const RECAPTCHA_SECRET_KEY = Deno.env.get('RECAPTCHA_SECRET_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: FormData = await req.json();
    const { recaptcha_token, ...formData } = body;

    if (!RECAPTCHA_SECRET_KEY) {
      throw new Error('El secreto de reCAPTCHA no está configurado en el servidor.');
    }

    const recaptchaUrl = 'https://www.google.com/recaptcha/api/siteverify';
    const response = await fetch(recaptchaUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${RECAPTCHA_SECRET_KEY}&response=${recaptcha_token}`,
    });

    const recaptchaData = await response.json();

    if (!recaptchaData.success) {
      return new Response(JSON.stringify({ error: 'La verificación de reCAPTCHA ha fallado.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Llamamos a la función RPC existente, inyectando el estado de la suscripción
    const { data: rpcData, error: rpcError } = await supabaseClient.rpc('create_tenant_with_admin', {
      name: formData.name,
      subscription_status: 'trial', // <-- CAMBIO CLAVE: Forzamos el estado a 'trial'
      country_id: formData.country_id,
      default_language_code: formData.default_language_code,
      default_currency_id: formData.default_currency_id,
      default_timezone: formData.default_timezone,
      contact_phone: formData.contact_phone,
      whatsapp_phone: formData.whatsapp_phone,
      commercial_email: formData.commercial_email,
      legal_name: formData.legal_name,
      tax_id: formData.tax_id,
      billing_address: formData.billing_address,
      einvoicing_email: formData.einvoicing_email,
      physical_address_line1: formData.physical_address_line1,
      physical_address_line2: formData.physical_address_line2,
      physical_city: formData.physical_city,
      physical_state: formData.physical_state,
      physical_postal_code: formData.physical_postal_code,
      website: formData.website,
      latitude: formData.latitude,
      longitude: formData.longitude,
      admin_email: formData.admin_email,
      admin_password: formData.admin_password,
    });

    if (rpcError) {
      throw new Error(rpcError.message);
    }

    return new Response(JSON.stringify(rpcData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
