import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jwtDecode } from "https://esm.sh/jwt-decode@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const fileId = url.searchParams.get('fileId');

    if (!fileId) {
      return new Response(JSON.stringify({ error: 'Falta el parámetro fileId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Obtener el token de autorización del request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization Header');
    }
    const token = authHeader.replace('Bearer ', '');
    const decodedToken: any = jwtDecode(token);
    const tenantId = decodedToken.app_metadata?.assignments?.[0]?.tenant_id;

    if (!tenantId) {
      throw new Error('Tenant ID not found in JWT app_metadata.assignments[0].tenant_id.');
    }

    // 2. Crear cliente Supabase Admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. Obtener la integración de Google Drive del tenant
    const { data: googleDriveIntegration, error: fetchIntegrationError } = await supabaseAdmin
      .from('tenant_integrations')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('provider', 'google_drive')
      .single();

    if (fetchIntegrationError) throw new Error(`Failed to fetch Google Drive integration: ${fetchIntegrationError.message}`);
    if (!googleDriveIntegration.encrypted_credentials || !googleDriveIntegration.nonce) {
      throw new Error('La integración de Google Drive no tiene las credenciales encriptadas.');
    }

    // 4. Desencriptar el refresh_token
    const { data: decryptedResponse, error: decryptError } = await supabaseAdmin.functions.invoke(
      'decrypt-secret',
      { body: { encryptedData: googleDriveIntegration.encrypted_credentials, iv: googleDriveIntegration.nonce } }
    );

    if (decryptError) throw new Error(`Failed to invoke decrypt-secret function: ${decryptError.message}`);
    const refreshToken = decryptedResponse.decryptedText;
    if (!refreshToken) throw new Error('La respuesta de descifrado no contenía "decryptedText".');

    // 5. Usar el refresh_token para obtener un nuevo access_token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: Deno.env.get('GOOGLE_CLIENT_ID'),
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET'),
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.json();
      throw new Error(`Google token refresh failed: ${JSON.stringify(errorBody)}`);
    }
    const tokens = await tokenResponse.json();
    const accessToken = tokens.access_token;

    // 6. Descargar el archivo de Google Drive usando el access_token
    const googleDriveUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`; // Usar alt=media para descarga directa

    const response = await fetch(googleDriveUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: { ...corsHeaders },
      });
    }

    const imageBody = response.body;
    const headers = new Headers(corsHeaders);
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.startsWith('image/')) {
      headers.set('content-type', contentType);
    } else {
      return new Response(JSON.stringify({ error: 'El archivo obtenido de Google Drive no es una imagen o tiene un tipo de contenido inesperado.' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new Response(imageBody, {
      status: 200,
      headers: headers,
    });

  } catch (error) {
    console.error('Error en la función proxy-google-drive-image:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});