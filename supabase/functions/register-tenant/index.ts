import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, User } from 'https://esm.sh/@supabase/supabase-js@2';

// Definición de tipos para los datos del formulario que esperamos recibir
interface FormData {
  platform_id: string;
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

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  let newUser: User | null = null;

  try {
    const { recaptcha_token, platform_id, admin_email, admin_password, ...tenant_creation_data }: FormData = await req.json();

    // --- Validación del lado del servidor ---
    if (!RECAPTCHA_SECRET_KEY) throw new Error('El secreto de reCAPTCHA no está configurado.');
    if (!platform_id) throw new Error('El ID de la plataforma es requerido.');
    if (!admin_email || !admin_password) throw new Error('El email y la contraseña son requeridos.');

    // Obtener el ID del rol 'tenant_super_admin'
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', 'tenant_super_admin')
      .single();

    if (roleError || !roleData) {
      throw new Error(`Error al obtener el ID del rol tenant_super_admin: ${roleError?.message || 'No encontrado'}`);
    }
    const tenantSuperAdminRoleId = roleData.id;

    // --- Verificación de reCAPTCHA ---
    const recaptchaUrl = 'https://www.google.com/recaptcha/api/siteverify';
    const response = await fetch(recaptchaUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${RECAPTCHA_SECRET_KEY}&response=${recaptcha_token}`,
    });
    const recaptchaData = await response.json();
    if (!recaptchaData.success) throw new Error('La verificación de reCAPTCHA ha fallado.');

    // --- Orquestación de Registro ---

    // Paso 1: Crear el usuario en Supabase Auth con email sintético
    const synthetic_email = `${platform_id}_${admin_email}`;
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email: synthetic_email,
      password: admin_password,
      options: {
        data: {
          platform_id: platform_id,
        },
        user_metadata: {
          real_email: admin_email,
        }
      }
    });

    if (authError) {
      if (authError.message.includes('User already registered')) {
        throw new Error(`El email ${admin_email} ya ha sido registrado para esta plataforma.`);
      }
      throw new Error(`Error al crear el usuario: ${authError.message}`);
    }
    if (!authData.user) {
      throw new Error('La creación del usuario no devolvió un objeto de usuario.');
    }
    newUser = authData.user;

    // Paso 2: Llamar a la RPC con los datos explícitos para evitar race conditions
    const { data: tenantId, error: rpcError } = await supabaseAdmin.rpc('setup_tenant_for_new_user', {
      p_user_id: newUser.id,
      p_platform_id: platform_id,
      p_tenant_data: tenant_creation_data
    });

    if (rpcError) {
      throw new Error(`Error al configurar el tenant: ${rpcError.message}`);
    }

    // Paso 3: Actualizar el app_metadata del usuario con la asignación completa
    const newAssignment = {
      assignment_id: crypto.randomUUID(), // Generar un ID único para la asignación
      tenant_id: tenantId, // El ID del tenant recién creado
      role_id: tenantSuperAdminRoleId, // El ID del rol tenant_super_admin
      status: 'active', // Estado inicial de la asignación
      // branch_id se omite para tenant_super_admin
    };

    const { data: updatedUserResponse, error: updateMetadataError } = await supabaseAdmin.auth.admin.updateUserById(
      newUser.id,
      { app_metadata: { assignments: [newAssignment] } } // Sobrescribir con la nueva asignación
    );

    if (updateMetadataError) {
      throw new Error(`Error al actualizar el app_metadata del usuario: ${updateMetadataError.message}`);
    }

    return new Response(JSON.stringify({ 
        success: true, 
        message: '¡Registro completado! Se ha enviado un correo de confirmación.',
        user_id: newUser.id,
        tenant_id: tenantId
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    if (newUser && newUser.id) {
      await supabaseAdmin.auth.admin.deleteUser(newUser.id);
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
