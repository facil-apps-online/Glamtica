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
  admin_password?: string;
  recaptcha_token: string;
}

const RECAPTCHA_SECRET_KEY = Deno.env.get('RECAPTCHA_SECRET_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('--- Invocación de register-tenant ---');
  
  if (req.method === 'OPTIONS') {
    console.log('Respondiendo a solicitud OPTIONS (preflight).');
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  let createdUserId: string | null = null;
  let isNewUser = false;

  try {
    const payload: FormData = await req.json();
    console.log('--- PAYLOAD COMPLETO RECIBIDO ---');
    console.log(JSON.stringify(payload, null, 2));
    console.log('---------------------------------');

    const { recaptcha_token, platform_id, admin_email, admin_password, ...tenant_data } = payload;
    console.log('Datos clave extraídos:', { platform_id, admin_email, tenant_data: Object.keys(tenant_data) });

    // 1. Validación de reCAPTCHA
    console.log('Paso 1: Validando reCAPTCHA...');
    if (!RECAPTCHA_SECRET_KEY) throw new Error('El secreto de reCAPTCHA no está configurado.');
    const recaptchaUrl = 'https://www.google.com/recaptcha/api/siteverify';
    const response = await fetch(recaptchaUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${RECAPTCHA_SECRET_KEY}&response=${recaptcha_token}`,
    });
    const recaptchaData = await response.json();
    if (!recaptchaData.success) {
      console.error('Error de reCAPTCHA:', recaptchaData['error-codes']);
      throw new Error('La verificación de reCAPTCHA ha fallado.');
    }
    console.log('reCAPTCHA validado exitosamente.');

    // 2. Buscar o crear el usuario en auth.users
    console.log('Paso 2: Buscando o creando usuario en auth.users...');
    const synthetic_email = `${platform_id}_${admin_email}`;
    let targetUser: User | null = null;

    console.log(`Buscando usuario con email sintético: ${synthetic_email}`);
    const { data: { users: existingUsers }, error: findError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (findError) throw new Error(`Error al buscar usuario: ${findError.message}`);

    // Verificación manual estricta para evitar falsos positivos de la búsqueda de Supabase
    const strictlyFoundUser = existingUsers.find(user => user.email === synthetic_email);

    if (strictlyFoundUser) {
      targetUser = strictlyFoundUser;
      isNewUser = false;
      console.log(`Usuario encontrado con coincidencia estricta. ID: ${targetUser.id}`);
    } else {
      console.log('Usuario no encontrado con coincidencia estricta. Procediendo a crear uno nuevo.');
      if (!admin_password) throw new Error('La contraseña es obligatoria para un nuevo usuario.');
      
      console.log('Intentando crear usuario en Supabase Auth...');
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: synthetic_email,
        password: admin_password,
        email_confirm: true,
        user_metadata: { real_email: admin_email },
      });

      if (authError) {
        console.error('--- ERROR DETALLADO DE SUPABASE AUTH ---');
        console.error(JSON.stringify(authError, null, 2));
        console.error('-----------------------------------------');
        throw new Error(`Error al crear el usuario: ${authError.message}`);
      }
      
      if (!authData.user) {
        throw new Error('La creación del usuario no devolvió un objeto de usuario.');
      }
      
      targetUser = authData.user;
      createdUserId = targetUser.id;
      isNewUser = true;
      console.log(`Nuevo usuario creado exitosamente con ID: ${createdUserId}`);
    }

    if (!targetUser) {
      throw new Error('No se pudo determinar el usuario objetivo para la asignación.');
    }

    // 3. Crear el Tenant
    console.log('Paso 3: Creando el tenant...');
    const { data: newTenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({ ...tenant_data, platform_id })
      .select()
      .single();
    if (tenantError) throw new Error(`Error al crear el tenant: ${tenantError.message}`);
    console.log(`Tenant creado con ID: ${newTenant.id}`);

    // 4. Buscar el plan de prueba
    console.log('Paso 4: Buscando el plan de prueba...');
    const { data: trialPlan, error: trialPlanError } = await supabaseAdmin
      .from('subscription_plans')
      .select('id, duration_days')
      .eq('platform_id', platform_id)
      .eq('is_default_trial', true)
      .single();
    if (trialPlanError || !trialPlan) throw new Error(`No se encontró un plan de prueba predeterminado: ${trialPlanError?.message || 'Plan no encontrado'}`);
    console.log(`Plan de prueba encontrado con ID: ${trialPlan.id}`);

    // 5. Crear la suscripción de prueba
    console.log('Paso 5: Creando la suscripción de prueba...');
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + trialPlan.duration_days);
    const { error: subscriptionError } = await supabaseAdmin
      .from('tenant_subscriptions')
      .insert({
        tenant_id: newTenant.id,
        subscription_plan_id: trialPlan.id,
        active_plan_id: trialPlan.id,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        is_trial: true,
        is_active: true,
      });
    if (subscriptionError) throw new Error(`Error al crear la suscripción de prueba: ${subscriptionError.message}`);
    console.log('Suscripción de prueba creada.');

    // 6. Crear la Sucursal Principal
    console.log('Paso 6: Creando la sucursal principal...');
    const fullAddress = [
      newTenant.physical_address_line1,
      newTenant.physical_address_line2
    ].filter(Boolean).join(', ');
    const { data: newBranch, error: branchError } = await supabaseAdmin
      .from('branches')
      .insert({
        tenant_id: newTenant.id,
        name: 'Sucursal Principal',
        status: 'active',
        is_main_branch: true,
        timezone: newTenant.default_timezone,
        address: fullAddress,
        physical_address_line1: newTenant.physical_address_line1 || 'N/A',
        physical_city: newTenant.physical_city || 'N/A',
        physical_state: newTenant.physical_state || 'N/A',
        physical_postal_code: newTenant.physical_postal_code || 'N/A',
        contact_phone: newTenant.contact_phone || null,
        commercial_email: newTenant.commercial_email || null,
        latitude: newTenant.latitude,
        longitude: newTenant.longitude
      })
      .select('id')
      .single();
    if (branchError) throw new Error(`Error al crear la sucursal principal: ${branchError.message}`);
    console.log(`Sucursal principal creada con ID: ${newBranch.id}`);

    // 7. Obtener el rol de Super Administrador
    console.log('Paso 7: Obteniendo el rol de Super Administrador...');
    const { data: roleData, error: roleError } = await supabaseAdmin.from('roles').select('id').eq('name', 'tenant_super_admin').single();
    if (roleError || !roleData) throw new Error('No se pudo encontrar el rol de tenant_super_admin.');
    console.log(`Rol de Super Administrador encontrado con ID: ${roleData.id}`);

    // 8. Insertar la asignación
    console.log('Paso 8: Insertando la asignación del usuario...');
    const { error: assignmentError } = await supabaseAdmin
      .from('user_assignments')
      .insert({
        user_id: targetUser.id,
        tenant_id: newTenant.id,
        branch_id: newBranch.id,
        role_id: roleData.id,
        status: 'active',
      });
    if (assignmentError) {
      console.error('--- ERROR DETALLADO DEL INSERT EN user_assignments ---');
      console.error(JSON.stringify(assignmentError, null, 2));
      console.error('----------------------------------------------------');
      throw new Error(`Error al crear la asignación del usuario: ${assignmentError.message}`);
    }
    console.log('Asignación de usuario creada exitosamente.');

    console.log('--- Proceso de registro finalizado exitosamente ---');
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
    
    if (isNewUser && createdUserId) {
      console.log(`Intentando revertir la creación del usuario con ID: ${createdUserId}`);
      await supabaseAdmin.auth.admin.deleteUser(createdUserId);
      console.log('Reversión de usuario completada.');
    }
    
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});