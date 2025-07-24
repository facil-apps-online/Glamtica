import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Helper function to find or create a folder in Google Drive
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

  // If not found, create it
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
    // 1. Extract parameters from the request body
    const { tenantId, fileBase64, mimeType, fileName, uploadContext, contextId } = await req.json();
    if (!tenantId || !fileBase64 || !mimeType || !fileName || !uploadContext || !contextId) {
      return new Response(JSON.stringify({ error: 'Missing required body parameters: tenantId, fileBase64, mimeType, fileName, uploadContext, contextId are required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. Determine the correct tenantId for the integration lookup
    let integrationTenantId = tenantId;
    if (uploadContext === 'Avatars') {
      const { data: ownerId, error: rpcError } = await supabaseAdmin.rpc('get_system_owner_tenant_id');
      if (rpcError) throw new Error(`Could not get system owner tenant ID: ${rpcError.message}`);
      if (!ownerId) throw new Error('System owner tenant ID not found.');
      integrationTenantId = ownerId;
    }

    // 4. Fetch the Google Drive integration using the determined tenantId
    const { data: googleDriveIntegration, error: fetchIntegrationError } = await supabaseAdmin
      .from('tenant_integrations')
      .select('*')
      .eq('tenant_id', integrationTenantId)
      .eq('provider', 'google_drive')
      .single();

    if (fetchIntegrationError) throw new Error(`Failed to fetch Google Drive integration for tenant ${integrationTenantId}: ${fetchIntegrationError.message}`);
    if (!googleDriveIntegration.encrypted_credentials || !googleDriveIntegration.nonce) {
      throw new Error('La integración de Google Drive no tiene las credenciales encriptadas.');
    }

    // 5. Decrypt the refresh_token
    const { data: decryptedResponse, error: decryptError } = await supabaseAdmin.functions.invoke(
      'decrypt-secret',
      { body: { encryptedData: googleDriveIntegration.encrypted_credentials, iv: googleDriveIntegration.nonce } }
    );

    if (decryptError) throw new Error(`Failed to invoke decrypt-secret function: ${decryptError.message}`);
    
    const refreshToken = decryptedResponse.decryptedText;
    if (!refreshToken) throw new Error('La respuesta de descifrado no contenía "decryptedText".');

    // 5. Use the refresh_token to get a new access_token
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

    // 6. Create dynamic folder structure
    const rootFolderId = await findOrCreateFolder('Glamtica', null, accessToken);
    const contextFolderId = await findOrCreateFolder(uploadContext, rootFolderId, accessToken);
    const finalFolderId = await findOrCreateFolder(contextId, contextFolderId, accessToken);

    // 7. Upload the file to Google Drive
    const fileBuffer = Uint8Array.from(atob(fileBase64), c => c.charCodeAt(0));
    const boundary = '----------GlamticaFileBoundary';
    const now = new Date();
    const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
    const newFileName = `${timestamp}_${fileName}`;

    const metadata = { name: newFileName, mimeType, parents: [finalFolderId] };
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

    // 8. Make the file public
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'reader', type: 'anyone' }),
      }
    );

    // 9. Return only the fileId
    return new Response(JSON.stringify({ success: true, fileId: fileId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generic Google Drive upload flow:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});