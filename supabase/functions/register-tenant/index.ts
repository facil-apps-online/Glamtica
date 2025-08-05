import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, User } from 'https://esm.sh/@supabase/supabase-js@2';

// Definición de tipos para los datos del formulario
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
  admin_password?: string; // La contraseña es opcional ahora
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

  let createdUserId: string | null = null;
  let isNewUser = false;

  try {
    const { recaptcha_token, platform_id, admin_email, admin_password, ...tenant_creation_data }: FormData = await req.json();

    // --- Validación del lado del servidor ---
    if (!RECAPTCHA_SECRET_KEY) throw new Error('El secreto de reCAPTCHA no está configurado.');
    if (!platform_id) throw new Error('El ID de la plataforma es requerido.');
    if (!admin_email) throw new Error('El email del administrador es requerido.');

    // --- Verificación de reCAPTCHA ---
    const recaptchaUrl = 'https://www.google.com/recaptcha/api/siteverify';
    const response = await fetch(recaptchaUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${RECAPTCHA_SECRET_KEY}&response=${recaptcha_token}`,
    });
    const recaptchaData = await response.json();
    if (!recaptchaData.success) throw new Error('La verificación de reCAPTCHA ha fallado.');

    // --- Lógica Unificada de Usuario y Tenant ---
    console.log(`Iniciando registro para el email: ${admin_email}`);

    const synthetic_email = `${platform_id}_${admin_email}`;
    let targetUser: User;
    let existingAssignments: any[] = [];

    // 1. Buscar si el usuario ya existe
    const { data: { users: existingUsers }, error: findError } = await supabaseAdmin.auth.admin.listUsers({ email: synthetic_email });
    if (findError) throw new Error(`Error al buscar usuario: ${findError.message}`);

    if (existingUsers && existingUsers.length > 0) {
      // --- CASO: USUARIO EXISTENTE ---
      console.log(`Usuario encontrado con email sintético ${synthetic_email}. Vinculando a nuevo tenant.`);
      targetUser = existingUsers[0];
      existingAssignments = targetUser.app_metadata?.assignments || [];
      isNewUser = false;
    } else {
      // --- CASO: USUARIO NUEVO ---
      console.log(`Usuario no encontrado. Creando nuevo usuario con email sintético ${synthetic_email}.`);
      if (!admin_password) throw new Error('La contraseña es obligatoria para registrar un nuevo usuario.');

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: synthetic_email,
        password: admin_password,
        email_confirm: true, // Confirmamos el email automáticamente
        user_metadata: { real_email: admin_email },
        app_metadata: { assignments: [] }, // Inicializar con array vacío
      });

      if (authError) throw new Error(`Error al crear el usuario: ${authError.message}`);
      if (!authData.user) throw new Error('No se pudo obtener el objeto de usuario después de la creación.');
      
      targetUser = authData.user;
      createdUserId = targetUser.id; // Guardar ID para posible rollback
      isNewUser = true;
    }

    // 2. Crear el Tenant
    console.log('Creando la nueva entidad de tenant...');
    const tenantPayload = {
      name: tenant_creation_data.name,
      country_id: tenant_creation_data.country_id,
      default_language_code: tenant_creation_data.default_language_code,
      default_currency_id: tenant_creation_data.default_currency_id,
      default_timezone: tenant_creation_data.default_timezone,
      contact_phone: tenant_creation_data.contact_phone,
      whatsapp_phone: tenant_creation_data.whatsapp_phone,
      commercial_email: tenant_creation_data.commercial_email,
      legal_name: tenant_creation_data.legal_name,
      tax_id: tenant_creation_data.tax_id,
      billing_address: tenant_creation_data.billing_address,
      einvoicing_email: tenant_creation_data.einvoicing_email,
      physical_address_line1: tenant_creation_data.physical_address_line1,
      physical_address_line2: tenant_creation_data.physical_address_line2,
      physical_city: tenant_creation_data.physical_city,
      physical_state: tenant_creation_data.physical_state,
      physical_postal_code: tenant_creation_data.physical_postal_code,
      website: tenant_creation_data.website,
      latitude: tenant_creation_data.latitude,
      longitude: tenant_creation_data.longitude,
      platform_id: platform_id,
    };

    const { data: newTenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert(tenantPayload)
      .select()
      .single();

    if (tenantError) throw new Error(`Error al crear el tenant: ${tenantError.message}`);
    console.log(`Tenant creado con ID: ${newTenant.id}`);

    // 3. Preparar y añadir la nueva asignación
    const { data: roleData, error: roleError } = await supabaseAdmin.from('roles').select('id').eq('name', 'tenant_super_admin').single();
    if (roleError || !roleData) throw new Error('No se pudo encontrar el rol de tenant_super_admin.');

    const newAssignment = {
      assignment_id: crypto.randomUUID(),
      tenant_id: newTenant.id,
      role_id: roleData.id,
      status: 'active',
      branch_id: null,
    };

    const finalAssignments = [...existingAssignments, newAssignment];

    // 4. Actualizar el app_metadata del usuario
    console.log('Actualizando app_metadata del usuario con la nueva asignación...');
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,
      { app_metadata: { assignments: finalAssignments } }
    );

    if (updateError) throw new Error(`Error al actualizar las asignaciones del usuario: ${updateError.message}`);

    console.log('¡Proceso completado exitosamente!');
    return new Response(JSON.stringify({ 
        success: true, 
        message: '¡Registro completado exitosamente!',
        user_id: targetUser.id,
        tenant_id: newTenant.id
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('--- ERROR EN register-tenant ---');
    console.error('Error:', error.message);

    // Si se creó un usuario nuevo en este proceso fallido, lo eliminamos para mantener la consistencia.
    if (isNewUser && createdUserId) {
      console.log(`Realizando rollback: eliminando usuario huérfano con ID ${createdUserId}`);
      await supabaseAdmin.auth.admin.deleteUser(createdUserId);
    }

    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});