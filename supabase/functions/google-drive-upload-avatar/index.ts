import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verify } from 'https://deno.land/x/djwt@v2.2/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

async function findOrCreateFolder(
  folderName: string,
  parentFolderId: string | null,
  accessToken: string
): Promise<string> {
  const q = `'${parentFolderId || 'root'}' in parents and name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const searchResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`,
    {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    }
  );
  if (!searchResponse.ok) {
    const errorBody = await searchResponse.json();
    throw new Error(`Failed to search for folder ${folderName}: ${JSON.stringify(errorBody)}`);
  }
  const searchResult = await searchResponse.json();
  if (searchResult.files.length > 0) {
    return searchResult.files[0].id;
  }
  const createMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: parentFolderId ? [parentFolderId] : [],
  };
  const createResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createMetadata),
    }
  );
  if (!createResponse.ok) {
    const errorBody = await createResponse.json();
    throw new Error(`Failed to create folder ${folderName}: ${JSON.stringify(errorBody)}`);
  }
  const createdFolder = await createResponse.json();
  return createdFolder.id;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Verify the JWT from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid Authorization header');
    }
    const token = authHeader.split(' ')[1];

    const jwtSecret = Deno.env.get('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not set in environment variables');
    }
    
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );

    const decodedPayload = await verify(token, key, "HS256");
    
    const userId = decodedPayload.sub;
    const userRole = decodedPayload.app_metadata?.role;
    const userTenantId = decodedPayload.tenant_id;

    if (!userId || !userRole || !userTenantId) {
      throw new Error('Token is missing required user information.');
    }

    // 2. Extract parameters from the request body
    const { fileName, fileBase64, mimeType } = await req.json();
    if (!fileName || !fileBase64 || !mimeType) {
      return new Response(JSON.stringify({ error: 'Missing required body parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Create Supabase admin client for elevated operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 4. Fetch tenant integrations using the verified user details
    const { data: integrationsData, error: fetchIntegrationsError } = await supabaseAdmin.rpc(
      'get_tenant_integrations', 
      { p_tenant_id: userTenantId, p_user_role: userRole }
    );

    if (fetchIntegrationsError || !integrationsData || integrationsData.length === 0) {
      throw new Error(`Failed to fetch tenant integrations: ${fetchIntegrationsError?.message || 'No integrations found'}`);
    }

    const googleDriveIntegration = integrationsData.find(integration => integration.provider === 'google_drive');

    if (!googleDriveIntegration || !googleDriveIntegration.encrypted_credentials || !googleDriveIntegration.nonce) {
      throw new Error('La integración de Google Drive no se encontró o le faltan las credenciales encriptadas.');
    }

    // 5. Desencriptar el refresh_token usando la Edge Function
    const { data: decryptedResponse, error: decryptError } = await supabaseAdmin.functions.invoke(
      'decrypt-secret',
      {
        body: {
          encryptedData: googleDriveIntegration.encrypted_credentials,
          iv: googleDriveIntegration.nonce,
        },
      }
    );

    if (decryptError) {
      throw new Error(`Failed to invoke decrypt-secret function: ${decryptError.message}`);
    }

    const credentialsJson = decryptedResponse.decryptedText;
    if (!credentialsJson) {
      throw new Error('La respuesta de descifrado no contenía "decryptedText".');
    }

    const credentials = JSON.parse(credentialsJson);
    const refreshToken = credentials.refresh_token;

    if (!refreshToken) {
      throw new Error("El campo 'refresh_token' no se encontró en las credenciales descifradas.");
    }

    // 6. Use the refresh_token to get a new access_token
    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
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

    let parentFolderId = googleDriveIntegration.folder_id;

    if (!parentFolderId) {
      const glamticaFolderId = await findOrCreateFolder('Glamtica', null, accessToken);
      const avatarsFolderId = await findOrCreateFolder('Avatars', glamticaFolderId, accessToken);
      parentFolderId = await findOrCreateFolder(userId, avatarsFolderId, accessToken);

      const { error: updateIntegrationError } = await supabaseAdmin
        .from('tenant_integrations')
        .update({ folder_id: parentFolderId })
        .eq('id', googleDriveIntegration.id);

      if (updateIntegrationError) {
        console.warn('Failed to update integration with folder_id:', updateIntegrationError);
      }
    }

    const fileBuffer = Uint8Array.from(atob(fileBase64), c => c.charCodeAt(0));
    const boundary = '----------GlamticaFileBoundary';
    const now = new Date();
    const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
    const lastDotIndex = fileName.lastIndexOf('.');
    const extension = lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
    const newFileName = `${timestamp}_${userId}${extension}`;

    const metadata = {
      name: newFileName,
      mimeType: mimeType,
      parents: [parentFolderId],
    };

    const encoder = new TextEncoder();
    const metadataPart = encoder.encode(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`);
    const mediaPart = encoder.encode(`--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`);
    const endPart = encoder.encode(`\r\n--${boundary}--\r\n`);
    const totalLength = metadataPart.length + mediaPart.length + fileBuffer.length + endPart.length;
    const requestBody = new Uint8Array(totalLength);
    let offset = 0;
    requestBody.set(metadataPart, offset);
    offset += metadataPart.length;
    requestBody.set(mediaPart, offset);
    offset += mediaPart.length;
    requestBody.set(fileBuffer, offset);
    offset += fileBuffer.length;
    requestBody.set(endPart, offset);

    const uploadResponse = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: requestBody,
      }
    );

    if (!uploadResponse.ok) {
      const errorBody = await uploadResponse.json();
      throw new Error(`Google Drive upload failed: ${JSON.stringify(errorBody)}`);
    }

    const driveFile = await uploadResponse.json();
    const fileId = driveFile.id;

    const permissionResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone',
        }),
      }
    );

    if (!permissionResponse.ok) {
      const errorBody = await permissionResponse.json();
      console.warn('Failed to set public permission on Google Drive file:', errorBody);
    }

    const directViewUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

    const { error: dbError } = await supabaseAdmin
      .from('users')
      .update({ avatar_url: directViewUrl })
      .eq('id', userId);

    if (dbError) throw dbError;

    return new Response(JSON.stringify({ success: true, avatarUrl: directViewUrl }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in Google Drive upload avatar flow:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});