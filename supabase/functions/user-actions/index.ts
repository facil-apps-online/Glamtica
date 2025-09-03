// Definición de las cabeceras CORS directamente en este archivo
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface RequestBody {
  action: string;
  payload: any;
}

Deno.serve(async (req) => {
  console.log('--- Nueva Invocación a user-actions ---');
  console.log('Método:', req.method);

  if (req.method === 'OPTIONS') {
    console.log('Respondiendo a petición OPTIONS (CORS pre-flight)');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, payload } = body;
    console.log('Acción recibida:', action);
    console.log('Payload recibido:', payload);

    // Cliente estándar para operaciones que no requieren rol de servicio (como el login)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Cliente Admin para operaciones que requieren bypass de RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.log('Clientes de Supabase creados.');

    let responseData: any;

    console.log(`[user-actions] Antes del switch - Acción: ${action}, Payload:`, payload);

    switch (action) {
            case 'login-tenant': {
        console.log('Iniciando acción: login-tenant');
        const { email, password, platform_id } = payload;
        if (!email || !password || !platform_id) {
          throw new Error('El email, la contraseña y el platform_id son obligatorios.');
        }

        const synthetic_email = `${platform_id}_${email}`;
        console.log(`Intentando iniciar sesión con email sintético: ${synthetic_email}`);

        const { data, error } = await supabase.auth.signInWithPassword({
          email: synthetic_email,
          password: password,
        });

        if (error) {
          console.error('Error detallado en signInWithPassword:', error);
          throw new Error(`Error de autenticación: ${error.message}`);
        }

        if (!data.session || !data.user) {
            throw new Error('Inicio de sesión fallido, no se recibió una sesión o usuario.');
        }
        
        // SIMPLIFICADO: Devolver solo la sesión y el usuario. El cliente se encargará
        // de llamar a 'get-active-assignments' para obtener los datos de la sesión.
        responseData = { success: true, session: data.session, user: data.user };
        break;
      }

      case 'confirm-user-email': {
        console.log('Iniciando acción: confirm-user-email');
        const { email, platform_id } = payload;
        if (!email || !platform_id) {
          throw new Error('El email y el platform_id son obligatorios para confirmar el email.');
        }

        const synthetic_email = `${platform_id}_${email}`;

        const { data: { users }, error: findError } = await supabaseAdmin.auth.admin.listUsers({ email: synthetic_email });
        if (findError) throw new Error(`Error al buscar usuario: ${findError.message}`);
        if (!users || users.length === 0) throw new Error('No se encontró un usuario con ese correo electrónico para esta plataforma.');
        
        const userToConfirm = users[0];

        const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userToConfirm.id,
          { email_confirm: true }
        );

        if (updateError) throw new Error(`Error al confirmar el email del usuario: ${updateError.message}`);
        
        responseData = { success: true, message: 'Email de usuario confirmado exitosamente.', user: updatedUser.user };
        break;
      }

      case 'switch-assignment': {
        console.log('Iniciando acción: switch-assignment');
        const { userId, newAssignmentId } = payload;
        if (!userId || !newAssignmentId) {
          throw new Error('El userId y el newAssignmentId son obligatorios.');
        }

        const { data, error } = await supabaseAdmin
          .from('user_assignments')
          .select('id')
          .eq('id', newAssignmentId)
          .eq('user_id', userId)
          .single();

        if (error || !data) {
          console.error('Error al verificar la asignación:', error);
          throw new Error('La asignación seleccionada no es válida para este usuario.');
        }

        responseData = { success: true, message: 'Asignación verificada exitosamente.' };
        break;
      }

      case 'update-user-settings': {
        console.log('Iniciando acción: update-user-settings');
        const { userId, metadata } = payload;
        if (!userId || !metadata) {
          throw new Error('El userId y los metadatos son obligatorios.');
        }

        const { data: { user: currentUser }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (getUserError) throw new Error(`Error de Supabase al obtener usuario: ${getUserError.message}`);

        const updatedUserMetadata = {
          ...currentUser.user_metadata,
          ...metadata,
        };

        const { data: updatedUserResponse, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { user_metadata: updatedUserMetadata }
        );

        if (updateError) {
          console.error('Error al actualizar user_metadata:', updateError.message);
          throw new Error(`Error al actualizar metadatos del usuario: ${updateError.message}`);
        }

        responseData = { success: true, message: 'Configuración de usuario actualizada.', user: updatedUserResponse.user };
        break;
      }

      case 'repair-user-assignments': {
        console.log('Iniciando acción: repair-user-assignments');
        const { userId, targetTenantId } = payload; // Add targetTenantId to payload
        if (!userId || !targetTenantId) { // Update validation
          throw new Error('El userId y targetTenantId son obligatorios para reparar las asignaciones.');
        }

        // 1. Obtener todos los datos maestros necesarios en paralelo
        const [
          { data: roles, error: rolesError },
          { data: tenants, error: tenantsError },
          { data: branches, error: branchesError }
        ] = await Promise.all([
          supabaseAdmin.from('roles').select('id, name'),
          supabaseAdmin.from('tenants').select('id, name'),
          supabaseAdmin.from('branches').select('id, name, tenant_id')
        ]);

        if (rolesError || tenantsError || branchesError) {
          console.error({ rolesError, tenantsError, branchesError });
          throw new Error('No se pudieron obtener los datos maestros para la reparación.');
        }

        // 2. Encontrar los IDs específicos que necesitamos para el targetTenantId
        const tenantSuperAdminRole = roles.find(r => r.name === 'tenant_super_admin');
        const tenantAdminRole = roles.find(r => r.name === 'tenant_admin');
        const tenantUserRole = roles.find(r => r.name === 'tenant_user');
        
        // Find branches specific to the targetTenantId
        const principalBranch = branches.find(b => b.name === 'Sucursal Principal' && b.tenant_id === targetTenantId);
        if (!principalBranch) throw new Error(`No se encontró la "Sucursal Principal" para el tenant ${targetTenantId}.`);
        
        const medellinBranch = branches.find(b => b.name === 'Medellín' && b.tenant_id === targetTenantId);
        if (!medellinBranch) throw new Error(`No se encontró la sucursal "Medellín" para el tenant ${targetTenantId}.`);

        if (!tenantSuperAdminRole || !tenantAdminRole || !tenantUserRole) {
          throw new Error('Uno o más roles requeridos no se encontraron en la base de datos.');
        }

        // 3. Construir el array de asignaciones corregido para el targetTenantId
        const correctAssignmentsForTargetTenant = [
          {
            assignment_id: crypto.randomUUID(),
            tenant_id: targetTenantId,
            role_id: tenantSuperAdminRole.id,
            branch_id: null,
            status: 'active',
          },
          {
            assignment_id: crypto.randomUUID(),
            tenant_id: targetTenantId,
            role_id: tenantAdminRole.id,
            branch_id: principalBranch.id,
            status: 'active',
          },
          {
            assignment_id: crypto.randomUUID(),
            tenant_id: targetTenantId,
            role_id: tenantUserRole.id,
            branch_id: medellinBranch.id,
            status: 'active',
          }
        ];

        console.log('Asignaciones corregidas construidas para el tenant objetivo:', correctAssignmentsForTargetTenant);

        // 4. Obtener el usuario y fusionar sus asignaciones
        const { data: { user: currentUser }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (getUserError) throw new Error(`Error al obtener el usuario: ${getUserError.message}`);

        const currentAppMetadata = currentUser.app_metadata || {};
        const existingAssignments = currentAppMetadata.assignments || [];

        // Filter out existing assignments for the targetTenantId
        const assignmentsForOtherTenants = existingAssignments.filter(
          (assignment: any) => assignment.tenant_id !== targetTenantId
        );

        // Combine assignments from other tenants with the new corrected assignments for the targetTenant
        const finalAssignments = [...assignmentsForOtherTenants, ...correctAssignmentsForTargetTenant];

        const { data: updatedUserResponse, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { app_metadata: { ...currentAppMetadata, assignments: finalAssignments } }
        );

        if (updateError) {
          throw new Error(`Error al actualizar los metadatos del usuario: ${updateError.message}`);
        }

        responseData = { success: true, message: 'Asignaciones de usuario reparadas exitosamente.', user: updatedUserResponse.user };
        break;
      }

      case 'confirm-user-email': {
        console.log('Iniciando acción: confirm-user-email');
        const { email, platform_id } = payload;
        if (!email || !platform_id) {
          throw new Error('El email y el platform_id son obligatorios para confirmar el email.');
        }

        const synthetic_email = `${platform_id}_${email}`;

        // Buscar al usuario por el email sintético
        const { data: { users }, error: findError } = await supabaseAdmin.auth.admin.listUsers({ email: synthetic_email });
        if (findError) throw new Error(`Error al buscar usuario: ${findError.message}`);
        if (!users || users.length === 0) throw new Error('No se encontró un usuario con ese correo electrónico para esta plataforma.');
        
        const userToConfirm = users[0];

        // Confirmar el email del usuario
        const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userToConfirm.id,
          { email_confirm: true } // Marca el email como confirmado
        );

        if (updateError) throw new Error(`Error al confirmar el email del usuario: ${updateError.message}`);
        
        responseData = { success: true, message: 'Email de usuario confirmado exitosamente.', user: updatedUser.user };
        break;
      }

      case 'switch-assignment': {
        console.log('Iniciando acción: switch-assignment');
        const { userId, newAssignmentId } = payload;
        if (!userId || !newAssignmentId) {
          throw new Error('El userId y el newAssignmentId son obligatorios.');
        }

        // Verificar que la asignación le pertenece al usuario en la tabla correcta.
        const { data, error } = await supabaseAdmin
          .from('user_assignments')
          .select('id')
          .eq('id', newAssignmentId)
          .eq('user_id', userId)
          .single();

        if (error || !data) {
          console.error('Error al verificar la asignación:', error);
          throw new Error('La asignación seleccionada no es válida para este usuario.');
        }

        // Si la verificación es exitosa, no necesitamos hacer nada más.
        // El cliente ya actualizó el estado localmente.
        responseData = { success: true, message: 'Asignación verificada exitosamente.' };
        break;
      }

      case 'update-user-settings': {
        console.log('Iniciando acción: update-user-settings');
        const { userId, metadata } = payload; // metadata contiene first_name, last_name, country_id, etc.
        if (!userId || !metadata) {
          throw new Error('El userId y los metadatos son obligatorios.');
        }

        // Obtener el usuario actual para fusionar el user_metadata existente
        const { data: { user: currentUser }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (getUserError) throw new Error(`Error de Supabase al obtener usuario: ${getUserError.message}`);

        const updatedUserMetadata = {
          ...currentUser.user_metadata, // Mantener el user_metadata existente
          ...metadata, // Superponer con los nuevos metadatos del payload
        };

        const { data: updatedUserResponse, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { user_metadata: updatedUserMetadata } // Actualizar user_metadata
        );

        if (updateError) {
          console.error('Error al actualizar user_metadata:', updateError.message);
          throw new Error(`Error al actualizar metadatos del usuario: ${updateError.message}`);
        }

        responseData = { success: true, message: 'Configuración de usuario actualizada.', user: updatedUserResponse.user };
        break;
      }

      case 'get-user-metadata': {
        console.log('Iniciando acción: get-user-metadata');
        const { userId } = payload;
        if (!userId) {
          throw new Error('User ID is required.');
        }

        const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

        if (userError) {
          console.error('Error fetching user by ID:', userError.message);
          throw new Error(userError.message);
        }

        console.log('get-user-metadata: full user object', user);
        console.log('get-user-metadata: user.app_metadata', user?.app_metadata);
        responseData = { success: true, metadata: user?.app_metadata };
        break;
      }

      case 'update-password': {
        console.log('Iniciando acción: update-password');
        const { userId, newPassword } = payload;
        if (!userId || !newPassword) {
          throw new Error('El userId y la nueva contraseña son obligatorios.');
        }

        const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { password: newPassword }
        );

        if (updateError) throw new Error(`Error de Supabase al actualizar la contraseña: ${updateError.message}`);
        
        responseData = { success: true, message: 'Contraseña actualizada exitosamente.' };
        break;
      }
      
      case 'generate-recovery-token': {
        console.log('Iniciando acción: generate-recovery-token');
        const { email, platform_id } = payload;
        if (!email || !platform_id) throw new Error('El email y el platform_id son obligatorios.');

        const synthetic_email = `${platform_id}_${email}`;

        const { data: { users }, error: findError } = await supabaseAdmin.auth.admin.listUsers({ email: synthetic_email });
        if (findError) throw new Error(`Error de Supabase al buscar usuario: ${findError.message}`);
        if (!users || users.length === 0) throw new Error('No se encontró un usuario con ese correo electrónico.');
        
        const user = users[0];
        const token = crypto.randomUUID();

        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          user.id,
          { user_metadata: { ...user.user_metadata, recovery_token: token, recovery_sent_at: new Date().toISOString() } })

        if (updateError) throw new Error(`Error de Supabase al actualizar usuario: ${updateError.message}`);
        
        responseData = { success: true, message: 'Token de recuperación generado.', token: token };
        break;
      }

      case 'set-password-with-token': {
        console.log('Iniciando acción: set-password-with-token');
        const { token, newPassword } = payload;
        if (!token || !newPassword) throw new Error('El token y la nueva contraseña son obligatorios.');

        const { data: users, error: rpcError } = await supabaseAdmin.rpc('get_user_by_recovery_token', { p_token: token });
        if (rpcError) throw rpcError;
        if (!users || users.length === 0) throw new Error('Token inválido, expirado o no encontrado.');
        
        const user = users[0];
        const { data: updatedUser, error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password: newPassword });
        if (updateUserError) throw updateUserError;

        const updatedMetadata = { ...user.user_metadata };
        delete updatedMetadata.recovery_token;
        delete updatedMetadata.recovery_sent_at;

        await supabaseAdmin.auth.admin.updateUserById(user.id, { user_metadata: updatedMetadata });
        
        responseData = { success: true, message: 'Contraseña actualizada exitosamente.', userId: updatedUser.user.id };
        break;
      }

      case 'check_user_exists_in_auth': {
        console.log('Iniciando acción: check_user_exists_in_auth');
        const { email, platformId } = payload;

        console.log(`[check_user_exists_in_auth] Payload recibido - Email: ${email}, PlatformId: ${platformId}`);

        if (!email || !platformId) {
          throw new Error('El email y el platformId son obligatorios para verificar la existencia del usuario.');
        }

        const synthetic_email = `${platformId}_${email}`;

        console.log(`[check_user_exists_in_auth] Buscando existencia de usuario con email sintético: ${synthetic_email} usando RPC check_user_exists_in_auth_rpc`);
        const { data: exists, error: rpcError } = await supabaseAdmin.rpc('check_user_exists_in_auth_rpc', { p_email: synthetic_email });
        
        if (rpcError) {
          console.error(`[check_user_exists_in_auth] Error al llamar a la RPC check_user_exists_in_auth_rpc: ${rpcError.message}`);
          throw new Error(`Error al verificar la existencia del usuario: ${rpcError.message}`);
        }
        
        console.log(`[check_user_exists_in_auth] Resultado de la RPC (exists):`, exists);
        
        responseData = { success: true, exists: exists };
        break;
      }

      case 'invite_or_assign_user_to_tenant': {
        console.log('Iniciando acción: invite_or_assign_user_to_tenant');
        const { email, password, tenantId, roleId, branchId, platformId, firstName, lastName } = payload;

        if (!email || !tenantId || !roleId || !platformId) {
          throw new Error('Los campos email, tenantId, roleId y platformId son obligatorios.');
        }

        const synthetic_email = `${platformId}_${email}`;
        let userToAssign;

        // 1. Find or create the user in auth.users
        const { data: existingUsers, error: findError } = await supabaseAdmin.auth.admin.listUsers({ email: synthetic_email });
        if (findError) throw new Error(`Error al buscar usuario: ${findError.message}`);

        if (existingUsers && existingUsers.users.length > 0) {
          userToAssign = existingUsers.users[0];
          console.log(`[invite_or_assign_user_to_tenant] Usuario existente encontrado:`, userToAssign.id);
        } else {
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: synthetic_email,
            password: password || crypto.randomUUID(), // Create with a random password if not provided
            email_confirm: true,
            user_metadata: {
              real_email: email,
              first_name: firstName,
              last_name: lastName,
            },
          });

          if (authError) throw new Error(`Error al crear el usuario: ${authError.message}`);
          userToAssign = authData.user;
          console.log(`[invite_or_assign_user_to_tenant] Usuario nuevo creado:`, userToAssign.id);
        }

        if (!userToAssign) {
          throw new Error('No se pudo obtener el usuario para asignar.');
        }

        // 2. Check if an assignment already exists in the user_assignments table
        const { data: existingAssignment, error: checkError } = await supabaseAdmin
          .from('user_assignments')
          .select('id')
          .eq('user_id', userToAssign.id)
          .eq('tenant_id', tenantId)
          .maybeSingle();

        if (checkError) throw new Error(`Error al verificar asignaciones existentes: ${checkError.message}`);
        if (existingAssignment) throw new Error('Este usuario ya es miembro de este negocio.');

        // 3. Insert the new assignment into the user_assignments table
        const { error: insertError } = await supabaseAdmin
          .from('user_assignments')
          .insert({
            tenant_id: tenantId,
            user_id: userToAssign.id,
            role_id: roleId,
            branch_id: branchId || null,
            status: 'active',
            platform_id: platformId
          });

        if (insertError) {
            console.error("Error inserting new assignment:", insertError);
            // Potentially delete the user if they were just created to keep things clean
            throw new Error(`Error al crear la asignación: ${insertError.message}`);
        }

        responseData = { success: true, message: 'Usuario asignado correctamente.', user: userToAssign };
        break;
      }

      case 'update-assignments': {
        const { userId, tenantId, assignments } = payload;
        if (!userId || !tenantId || !assignments) {
          throw new Error('userId, tenantId y assignments son obligatorios.');
        }

        const { error } = await supabaseAdmin.rpc('update_user_assignments', {
          p_user_id: userId,
          p_tenant_id: tenantId,
          p_new_assignments: assignments
        });

        if (error) {
          console.error('Error calling update_user_assignments RPC:', error);
          throw new Error('Ocurrió un error al actualizar las asignaciones.');
        }

        responseData = { success: true, message: 'Asignaciones de usuario actualizadas.' };
        break;
      }

      case 'create_auth_user': {
        console.log('Iniciando acción pura: create_auth_user');
        const { email, password, platformId } = payload;

        if (!email || !password || !platformId) {
          throw new Error('El email, la contraseña y el platformId son obligatorios.');
        }

        const synthetic_email = `${platformId}_${email}`;

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: synthetic_email,
          password: password,
          email_confirm: true,
          user_metadata: {
            email: email, // Guardamos únicamente el email real.
          },
        });

        console.log(`[create_auth_user] authData:`, authData);
        console.log(`[create_auth_user] authError:`, authError);

        if (authError) {
          throw new Error(`Error al crear el usuario: ${authError.message}`);
        }

        if (!authData.user) {
          throw new Error('No se pudo obtener el objeto de usuario después de la creación.');
        }

        responseData = { success: true, message: 'Usuario de Auth creado exitosamente.', user: authData.user };
        break;
      }

      case 'get-active-assignments': {
        console.log('Iniciando acción: get-active-assignments');
        const { userId, platformId } = payload;
        if (!userId || !platformId) {
          throw new Error('El userId y el platformId son obligatorios.');
        }

        const { data: assignments, error: queryError } = await supabaseAdmin
          .from('user_assignments')
          .select(`
            assignment_id:id,
            tenant_id,
            role_id,
            branch_id,
            status,
            tenants!inner ( name, platform_id ),
            roles ( name, display_name ),
            branches ( name )
          `)
          .eq('user_id', userId)
          .eq('status', 'active')
          .eq('tenants.platform_id', platformId);

        if (queryError) {
          console.error('Error al obtener las asignaciones activas:', queryError.message);
          throw new Error(`Error al consultar las asignaciones: ${queryError.message}`);
        }

        const mappedAssignments = assignments.map((a: any) => ({
          assignment_id: a.assignment_id,
          tenant_id: a.tenant_id,
          tenant_name: a.tenants.name || 'N/A',
          platform_id: platformId,
          role_id: a.role_id,
          role_name: a.roles.name || 'N/A',
          role_display_name: a.roles.display_name || 'N/A',
          branch_id: a.branch_id || null,
          branch_name: a.branches?.name || null,
          status: a.status,
        }));

        responseData = { success: true, assignments: mappedAssignments };
        break;
      }

      default:
        console.error('Acción no válida:', action);
        throw new Error(`La acción '${action}' no es válida.`);
    }

    console.log('Enviando respuesta exitosa.');
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('--- ERROR EN LA EDGE FUNCTION ---');
    console.error('Error:', error.message);
    // Always return 200 OK, but with success: false in the body.
    // The client will handle the error based on the 'success' flag.
    return new Response(JSON.stringify({
      success: false,
      message: error.message,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, 
    });
  }
});
