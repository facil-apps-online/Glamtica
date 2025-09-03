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
    const { recaptcha_token, platform_id, admin_email, admin_password, ...tenant_data }: FormData = await req.json();

    // 1. Validación de reCAPTCHA
    if (!RECAPTCHA_SECRET_KEY) throw new Error('El secreto de reCAPTCHA no está configurado.');
    const recaptchaUrl = 'https://www.google.com/recaptcha/api/siteverify';
    const response = await fetch(recaptchaUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${RECAPTCHA_SECRET_KEY}&response=${recaptcha_token}`,
    });
    const recaptchaData = await response.json();
    if (!recaptchaData.success) throw new Error('La verificación de reCAPTCHA ha fallado.');

    // 2. Buscar o crear el usuario en auth.users
    const synthetic_email = `${platform_id}_${admin_email}`;
    let targetUser: User;

    const { data: { users: existingUsers }, error: findError } = await supabaseAdmin.auth.admin.listUsers({ email: synthetic_email });
    if (findError) throw new Error(`Error al buscar usuario: ${findError.message}`);

    if (existingUsers && existingUsers.length > 0) {
      targetUser = existingUsers[0];
      isNewUser = false;
    } else {
      if (!admin_password) throw new Error('La contraseña es obligatoria para un nuevo usuario.');
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: synthetic_email,
        password: admin_password,
        email_confirm: true,
        user_metadata: { real_email: admin_email },
      });
      if (authError) throw new Error(`Error al crear el usuario: ${authError.message}`);
      targetUser = authData.user;
      createdUserId = targetUser.id;
      isNewUser = true;
    }

    // 3. Crear el Tenant
    const { data: newTenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({ ...tenant_data, platform_id })
      .select()
      .single();
    if (tenantError) throw new Error(`Error al crear el tenant: ${tenantError.message}`);

    // 4. Find the default trial plan for the platform
    const { data: trialPlan, error: trialPlanError } = await supabaseAdmin
      .from('subscription_plans')
      .select('id, duration_days')
      .eq('platform_id', platform_id)
      .eq('is_default_trial', true)
      .single();

    if (trialPlanError || !trialPlan) {
      throw new Error(`No se encontró un plan de prueba predeterminado para esta plataforma: ${trialPlanError?.message || 'Plan no encontrado'}`);
    }

    // 5. Create the trial subscription for the new tenant
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialPlan.duration_days);

    const { error: subscriptionError } = await supabaseAdmin
      .from('tenant_subscriptions')
      .insert({
        tenant_id: newTenant.id,
        plan_id: trialPlan.id,
        status: 'trialing',
        trial_ends_at: trialEndsAt.toISOString(),
        current_period_starts_at: new Date().toISOString(),
        current_period_ends_at: trialEndsAt.toISOString(),
      });

    if (subscriptionError) {
      throw new Error(`Error al crear la suscripción de prueba: ${subscriptionError.message}`);
    }

    // 6. Crear la Sucursal Principal
    const { data: newBranch, error: branchError } = await supabaseAdmin
      .from('branches')
      .insert({
        tenant_id: newTenant.id,
        name: 'Sucursal Principal',
        is_active: true,
        timezone: newTenant.default_timezone,
        address_line1: newTenant.physical_address_line1 || 'N/A',
        city: newTenant.physical_city || 'N/A',
        state: newTenant.physical_state || 'N/A',
        postal_code: newTenant.physical_postal_code || 'N/A',
        country_id: newTenant.country_id,
        phone: newTenant.contact_phone || null,
        email: newTenant.commercial_email || null,
        latitude: newTenant.latitude,
        longitude: newTenant.longitude
      })
      .select('id')
      .single();
    if (branchError) throw new Error(`Error al crear la sucursal principal: ${branchError.message}`);

    // 7. Obtener el rol de Super Administrador
    const { data: roleData, error: roleError } = await supabaseAdmin.from('roles').select('id').eq('name', 'tenant_super_admin').single();
    if (roleError || !roleData) throw new Error('No se pudo encontrar el rol de tenant_super_admin.');

    // 8. Insertar la asignación en la tabla user_assignments
    const { error: assignmentError } = await supabaseAdmin
      .from('user_assignments')
      .insert({
        user_id: targetUser.id,
        tenant_id: newTenant.id,
        branch_id: newBranch.id,
        role_id: roleData.id,
        status: 'active',
      });
    if (assignmentError) throw new Error(`Error al crear la asignación del usuario: ${assignmentError.message}`);

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
      console.log(`Realizando rollback: eliminando usuario huérfano con ID ${createdUserId}`);
      await supabaseAdmin.auth.admin.deleteUser(createdUserId);
    }

    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
