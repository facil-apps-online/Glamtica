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
          console.error('Error en signInWithPassword:', error.message);
          // Personalizar el mensaje para credenciales inválidas
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('El correo electrónico o la contraseña no son correctos.');
          }
          throw new Error(`Error de autenticación: ${error.message}`);
        }

        if (!data.session || !data.user) {
            throw new Error('Inicio de sesión fallido, no se recibió una sesión o usuario.');
        }

        // --- LÓGICA OPTIMIZADA PARA OBTENER ASIGNACIONES HIDRATADAS ---
        console.log('Usuario autenticado. Obteniendo asignaciones hidratadas desde la base de datos...');
        const authenticatedUser = data.user;

        // Llamar a la nueva función RPC para obtener las asignaciones ya hidratadas
        const { data: hydratedAssignments, error: rpcError } = await supabaseAdmin.rpc(
          'get_hydrated_user_assignments',
          { p_user_id: authenticatedUser.id }
        );

        if (rpcError) {
          console.error('Error al llamar a get_hydrated_user_assignments:', rpcError.message);
          throw new Error(`Error al obtener las asignaciones del usuario: ${rpcError.message}`);
        }

        console.log('Asignaciones hidratadas recibidas:', hydratedAssignments);

        // Crear un nuevo objeto de usuario con las asignaciones hidratadas, sin modificar el original
        const userWithHydratedAssignments = {
          ...authenticatedUser,
          app_metadata: {
            ...authenticatedUser.app_metadata,
            assignments: hydratedAssignments || [],
          },
        };

        // Devolver la sesión y el objeto de usuario con las asignaciones ya hidratadas
        responseData = { success: true, session: data.session, user: userWithHydratedAssignments };
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

        const { data: { user }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (getUserError) throw new Error(`Error al obtener usuario: ${getUserError.message}`);

        const assignments = user.app_metadata.assignments || [];
        console.log('[Edge Function] Asignaciones actuales antes de reordenar:', assignments);
        const targetAssignmentIndex = assignments.findIndex(a => a.assignment_id === newAssignmentId);

        if (targetAssignmentIndex === -1) {
          throw new Error('La asignación seleccionada no es válida para este usuario.');
        }

        const newAssignmentsOrder = [...assignments];
        const [targetAssignment] = newAssignmentsOrder.splice(targetAssignmentIndex, 1);
        newAssignmentsOrder.unshift(targetAssignment);
        console.log('[Edge Function] Nueva orden de asignaciones:', newAssignmentsOrder);

        const updatedAppMetadata = { ...user.app_metadata, assignments: newAssignmentsOrder };
        console.log('[Edge Function] app_metadata a enviar a updateUserById:', updatedAppMetadata);

        const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { app_metadata: updatedAppMetadata }
        );

        if (updateError) throw new Error(`Error al actualizar app_metadata: ${updateError.message}`);
        console.log('[Edge Function] app_metadata del usuario actualizado después de updateUserById:', updatedUser.user.app_metadata);

        responseData = { success: true, message: 'Asignación cambiada exitosamente.', user: updatedUser.user };
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
        console.log('[DEBUG] Iniciando acción: invite_or_assign_user_to_tenant');
        console.log('[DEBUG] Payload completo recibido:', JSON.stringify(payload, null, 2));

        const { email, password, tenantId, roleId, branchId, platformId, firstName, lastName } = payload;

        console.log(`[DEBUG] Variables extraídas:
          - email: ${email}
          - password: ${password ? 'Presente' : 'No presente'}
          - tenantId: ${tenantId}
          - roleId: ${roleId}
          - branchId: ${branchId}
          - platformId: ${platformId}
          - firstName: ${firstName}
          - lastName: ${lastName}
        `);

        // La validación de branchId se maneja en la lógica, aquí solo los campos esenciales.
        if (!email || !tenantId || !roleId || !platformId) {
          throw new Error('Los campos email, tenantId, roleId y platformId son obligatorios.');
        }

        const synthetic_email = `${platformId}_${email}`;
        let userToAssign;

        // 1. Buscar o crear el usuario en auth.users
        if (password) {
          // Escenario: Nuevo usuario, se proporciona contraseña. Crear directamente.
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: synthetic_email,
            password: password,
            email_confirm: true, // Lo confirmamos de inmediato
            user_metadata: {
              // Guardamos datos importantes para la UI
              real_email: email,
              first_name: firstName,
              last_name: lastName,
            },
            app_metadata: {
              // Inicializamos las asignaciones con la primera
              assignments: [] 
            }
          });

          if (authError) {
            throw new Error(`Error al crear el usuario: ${authError.message}`);
          }
          if (!authData.user) {
            throw new Error('No se pudo obtener el objeto de usuario después de la creación.');
          }
          userToAssign = authData.user;
          console.log(`[invite_or_assign_user_to_tenant] Usuario creado directamente:`, userToAssign);
        } else {
          // Escenario: Usuario existente, no se proporciona contraseña
          const { data: { users }, error: findError } = await supabaseAdmin.auth.admin.listUsers({ email: synthetic_email });
          if (findError || !users || users.length === 0) {
            throw new Error(`No se encontró un usuario con el email ${email} para esta plataforma.`);
          }
          userToAssign = users[0];
          console.log(`[invite_or_assign_user_to_tenant] userToAssign después de búsqueda:`, userToAssign);
        }

        if (!userToAssign) {
          throw new Error('No se pudo obtener el usuario para asignar.');
        }

        // 2. Gestionar asignaciones en app_metadata
        const appMetadata = userToAssign.app_metadata || {};
        const currentAssignments = appMetadata.assignments || [];

        // Verificar si el usuario ya tiene una asignación para este tenant
        const existingAssignment = currentAssignments.find(
          (assignment: any) => assignment.tenant_id === tenantId
        );

        if (existingAssignment) {
          throw new Error('Este usuario ya es miembro de este negocio.');
        }

        // Crear nueva asignación
        const newAssignment = {
          assignment_id: crypto.randomUUID(),
          tenant_id: tenantId,
          role_id: roleId,
          branch_id: branchId || null, // Asegurarse de que sea null si no se proporciona
          status: 'active', // Estado inicial de la asignación
        };

        const updatedAssignments = [...currentAssignments, newAssignment];

        const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userToAssign.id,
          { app_metadata: { ...appMetadata, assignments: updatedAssignments } }
        );

        if (updateError) {
          throw new Error(`Error al actualizar las asignaciones del usuario: ${updateError.message}`);
        }

        responseData = { success: true, message: 'Usuario asignado correctamente.', user: updatedUser.user };
        break;
      }

      case 'update-assignments': {
        console.log('Iniciando acción: update-assignments');
        const { userId, tenantId, assignments } = payload;

        if (!userId || !tenantId || !assignments) {
          throw new Error('userId, tenantId y assignments son obligatorios.');
        }

        // 1. Obtener el usuario actual para fusionar el app_metadata existente
        const { data: { user: currentUser }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (getUserError) throw new Error(`Error de Supabase al obtener usuario: ${getUserError.message}`);

        const currentAppMetadata = currentUser.app_metadata || {};
        const existingAssignments = currentAppMetadata.assignments || [];

        // 2. Filtrar las asignaciones existentes para excluir las del tenant actual
        const assignmentsForOtherTenants = existingAssignments.filter(
          (assignment: any) => assignment.tenant_id !== tenantId
        );

        // 3. Combinar las asignaciones de otros tenants con las nuevas asignaciones del tenant actual
        const updatedAssignments = [...assignmentsForOtherTenants, ...assignments];

        // 4. Actualizar el app_metadata del usuario
        const { data: updatedUserResponse, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { app_metadata: { ...currentAppMetadata, assignments: updatedAssignments } }
        );

        if (updateError) {
          console.error('Error al actualizar app_metadata con asignaciones:', updateError.message);
          throw new Error(`Error al actualizar asignaciones del usuario: ${updateError.message}`);
        }

        responseData = { success: true, message: 'Asignaciones de usuario actualizadas.', user: updatedUserResponse.user };
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
    return new Response(JSON.stringify({
      success: false,
      message: error.message,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
