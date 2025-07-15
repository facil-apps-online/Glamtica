import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const fileId = url.searchParams.get('fileId')

    if (!fileId) {
      return new Response(JSON.stringify({ error: 'Falta el parámetro fileId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Usamos `export=download` para forzar la descarga directa del contenido del archivo.
    const googleDriveUrl = `https://drive.google.com/uc?export=download&id=${fileId}`

    const response = await fetch(googleDriveUrl, { redirect: 'follow' })

    if (!response.ok) {
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: { ...corsHeaders },
      })
    }

    const imageBody = response.body
    const headers = new Headers(corsHeaders)
    const contentType = response.headers.get('content-type')
    
    // Asegurarnos de que el content-type sea el de una imagen
    if (contentType && contentType.startsWith('image/')) {
      headers.set('content-type', contentType)
    } else {
      // Si Google no nos da un tipo de imagen, no podemos continuar.
      // Esto puede pasar si el archivo no es una imagen o el enlace es incorrecto.
      return new Response(JSON.stringify({ error: 'El archivo obtenido de Google Drive no es una imagen.' }), {
        status: 502, // Bad Gateway, porque el upstream (Google) nos dio algo inesperado.
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new Response(imageBody, {
      status: 200,
      headers: headers,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
