import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to find or create a Google Drive folder
async function findOrCreateFolder(
  folderName: string,
  parentFolderId: string | null, // null for root
  accessToken: string
): Promise<string> {
  const q = `'${parentFolderId || 'root'}' in parents and name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const searchResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!searchResponse.ok) {
    const errorBody = await searchResponse.json();
    throw new Error(`Failed to search for folder ${folderName}: ${JSON.stringify(errorBody)}`);
  }

  const searchResult = await searchResponse.json();
  if (searchResult.files.length > 0) {
    return searchResult.files[0].id; // Folder found
  }

  // Folder not found, create it
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
    const requiredEnv = [
      'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'
    ];
    for (const env of requiredEnv) {
      if (!Deno.env.get(env)) {
        throw new Error(`Missing required environment variable: ${env}`);
      }
    }

    const { tenantId, userId, fileName, fileBase64, mimeType } = await req.json();

    if (!tenantId || !userId || !fileName || !fileBase64 || !mimeType) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Obtener el refresh_token encriptado de la base de datos usando la función RPC
    const { data: integrationsData, error: fetchIntegrationsError } = await supabaseAdmin.rpc(
      'get_tenant_integrations', 
      { p_tenant_id: tenantId, p_user_role: 'super_admin' } // Asumimos super_admin para esta función de backend
    );

    if (fetchIntegrationsError || !integrationsData || integrationsData.length === 0) {
      throw new Error(`Failed to fetch tenant integrations: ${fetchIntegrationsError?.message || 'No integrations found'}`);
    }

    const googleDriveIntegration = integrationsData.find(integration => integration.provider === 'google_drive');

    if (!googleDriveIntegration || !googleDriveIntegration.encrypted_refresh_token) {
      throw new Error('Google Drive integration not found or missing refresh token.');
    }

    // 2. Desencriptar el refresh_token
    const { data: decryptedRefreshToken, error: decryptError } = await supabaseAdmin.rpc(
      'decrypt_secret',
      { encrypted_value: googleDriveIntegration.encrypted_refresh_token }
    );

    if (decryptError) throw decryptError;

    const refreshToken = decryptedRefreshToken;

    // 3. Usar el refresh_token para obtener un nuevo access_token
    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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

    let parentFolderId = googleDriveIntegration.folder_id; // Assuming a 'folder_id' field in integrations table

    if (!parentFolderId) {
      // Create folder structure if not already stored
      const glamticaFolderId = await findOrCreateFolder('Glamtica', null, accessToken);
      const avatarsFolderId = await findOrCreateFolder('Avatars', glamticaFolderId, accessToken);
      parentFolderId = await findOrCreateFolder(userId, avatarsFolderId, accessToken);

      // Update the integration record with the new folder_id
      const { error: updateIntegrationError } = await supabaseAdmin
        .from('tenant_integrations') // Assuming your table is named 'tenant_integrations'
        .update({ folder_id: parentFolderId })
        .eq('id', googleDriveIntegration.id);

      if (updateIntegrationError) {
        console.warn('Failed to update integration with folder_id:', updateIntegrationError);
        // Do not throw, continue with upload
      }
    }

    // 2. Subir el archivo a Google Drive
    const fileBuffer = Uint8Array.from(atob(fileBase64), c => c.charCodeAt(0));

    const boundary = '----------GlamticaFileBoundary';

    // Generar timestamp
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const timestamp = `${year}${month}${day}_${hours}${minutes}${seconds}`;

    // Modificar el nombre del archivo para incluir el timestamp
    const lastDotIndex = fileName.lastIndexOf('.');
    let newFileName;
    const extension = lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
    newFileName = `${timestamp}_${userId}${extension}`;

    const metadata = {
      name: newFileName, // Usar el nuevo nombre de archivo
      mimeType: mimeType,
      parents: [parentFolderId], // Set the parent folder
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

    // 3. Hacer el archivo público (opcional, dependiendo de cómo se quiera acceder)
    // Para que la URL sea directamente accesible, necesitamos añadir un permiso
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
      // No lanzamos error aquí, ya que la subida fue exitosa, solo la visibilidad podría fallar
    }

    // 4. Construir la URL de visualización directa del archivo
    const directViewUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

    // 5. Actualizar la URL del avatar en la tabla public.users
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
