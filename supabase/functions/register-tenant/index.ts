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
const GLAMTICA_PLATFORM_ID = Deno.env.get('GLAMTICA_PLATFORM_ID'); // <-- Get Platform ID from env

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

    // --- Server-side validation ---
    if (!RECAPTCHA_SECRET_KEY) {
      throw new Error('El secreto de reCAPTCHA no está configurado en el servidor.');
    }
    if (!GLAMTICA_PLATFORM_ID) {
      throw new Error('El ID de la plataforma por defecto no está configurado en el servidor.');
    }

    // --- reCAPTCHA verification ---
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

    // Use the SERVICE_ROLE_KEY for this operation to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // --- Call the updated RPC function ---
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('create_tenant_with_admin', {
      p_platform_id: GLAMTICA_PLATFORM_ID, // <-- Pass the platform ID
      p_name: formData.name,
      p_country_id: formData.country_id,
      p_default_language_code: formData.default_language_code,
      p_default_currency_id: formData.default_currency_id,
      p_default_timezone: formData.default_timezone,
      p_contact_phone: formData.contact_phone,
      p_whatsapp_phone: formData.whatsapp_phone,
      p_commercial_email: formData.commercial_email,
      p_legal_name: formData.legal_name,
      p_tax_id: formData.tax_id,
      p_billing_address: formData.billing_address,
      p_einvoicing_email: formData.einvoicing_email,
      p_physical_address_line1: formData.physical_address_line1,
      p_physical_address_line2: formData.physical_address_line2,
      p_physical_city: formData.physical_city,
      p_physical_state: formData.physical_state,
      p_physical_postal_code: formData.physical_postal_code,
      p_website: formData.website,
      p_latitude: formData.latitude,
      p_longitude: formData.longitude,
      p_admin_email: formData.admin_email,
      // The RPC no longer takes the password directly
    });

    if (rpcError) {
      throw new Error(rpcError.message);
    }

    return new Response(JSON.stringify({ success: true, data: rpcData }), {
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