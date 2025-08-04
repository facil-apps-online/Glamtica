// Definición de las cabeceras CORS directamente en este archivo
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

        // --- LÓGICA PARA OBTENER Y ACTUALIZAR ASIGNACIONES DESDE app_metadata ---
        console.log('Usuario autenticado. Hidratando asignaciones desde app_metadata...');
        const authenticatedUser = data.user;
        const currentAppMetadata = authenticatedUser.app_metadata || {};
        const rawAssignments = currentAppMetadata.assignments || [];

        // FIX: Ensure every assignment has a unique ID
        const assignmentsWithIds = rawAssignments.map(a => ({
          ...a,
          assignment_id: a.assignment_id || crypto.randomUUID(),
        }));

        // Fetch all roles, tenants, and branches once in parallel
        const [{ data: allRoles, error: rolesError }, { data: allTenants, error: tenantsError }, { data: allBranches, error: branchesError }] = await Promise.all([
            supabaseAdmin.from('roles').select('id, name, display_name'),
            supabaseAdmin.from('tenants').select('id, name'),
            supabaseAdmin.from('branches').select('id, name'),
        ]);

        if (rolesError) console.warn(`Error fetching all roles:`, rolesError.message);
        if (tenantsError) console.warn(`Error fetching all tenants:`, tenantsError.message);
        if (branchesError) console.warn(`Error fetching all branches:`, branchesError.message);

        const hydratedAssignments = [];
        for (const assignment of assignmentsWithIds) {
            // Use pre-fetched data to hydrate assignment details
            const tenant = allTenants?.find(t => t.id === assignment.tenant_id);
            const role = allRoles?.find(r => r.id === assignment.role_id);
            const branch = allBranches?.find(b => b.id === assignment.branch_id);

            hydratedAssignments.push({
                ...assignment,
                tenant_name: tenant?.name || null,
                role_name: role?.name || null,
                role_display_name: role?.display_name || null,
                branch_name: branch?.name || null,
            });
        }

        console.log('Asignaciones hidratadas:', hydratedAssignments);

        // Actualizar el app_metadata del usuario con las asignaciones hidratadas
        const { data: updatedUserResponse, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          authenticatedUser.id,
          { app_metadata: { ...authenticatedUser.app_metadata, assignments: hydratedAssignments } })

        if (updateError) {
          console.error('Error al actualizar app_metadata con asignaciones hidratadas:', updateError.message);
          throw new Error(`Error al actualizar metadatos del usuario: ${updateError.message}`);
        }

        // Devolver la sesión y el usuario actualizados
        responseData = { success: true, session: data.session, user: updatedUserResponse.user };
        break;
      }

      case 'repair-user-assignments': {
        console.log('Iniciando acción: repair-user-assignments');
        const { userId } = payload;
        if (!userId) {
          throw new Error('El userId es obligatorio para reparar las asignaciones.');
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

        // 2. Encontrar los IDs específicos que necesitamos
        const tenantSuperAdminRole = roles.find(r => r.name === 'tenant_super_admin');
        const tenantAdminRole = roles.find(r => r.name === 'tenant_admin');
        const tenantUserRole = roles.find(r => r.name === 'tenant_user');
        
        // Asumimos que el tenant a reparar es el que contiene la sucursal "Sucursal Principal"
        const principalBranch = branches.find(b => b.name === 'Sucursal Principal');
        if (!principalBranch) throw new Error('No se encontró la "Sucursal Principal" para determinar el tenant.');
        
        const targetTenant = tenants.find(t => t.id === principalBranch.tenant_id);
        if (!targetTenant) throw new Error('No se pudo encontrar el tenant asociado a la "Sucursal Principal".');

        const medellinBranch = branches.find(b => b.name === 'Medellín' && b.tenant_id === targetTenant.id);
        if (!medellinBranch) throw new Error('No se encontró la sucursal "Medellín".');

        if (!tenantSuperAdminRole || !tenantAdminRole || !tenantUserRole) {
          throw new Error('Uno o más roles requeridos no se encontraron en la base de datos.');
        }

        // 3. Construir el array de asignaciones corregido
        const correctAssignments = [
          {
            assignment_id: crypto.randomUUID(),
            tenant_id: targetTenant.id,
            role_id: tenantSuperAdminRole.id,
            branch_id: null,
            status: 'active',
          },
          {
            assignment_id: crypto.randomUUID(),
            tenant_id: targetTenant.id,
            role_id: tenantAdminRole.id,
            branch_id: principalBranch.id,
            status: 'active',
          },
          {
            assignment_id: crypto.randomUUID(),
            tenant_id: targetTenant.id,
            role_id: tenantUserRole.id,
            branch_id: medellinBranch.id,
            status: 'active',
          }
        ];

        console.log('Asignaciones corregidas construidas:', correctAssignments);

        // 4. Obtener el usuario y reemplazar sus asignaciones
        const { data: { user: currentUser }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (getUserError) throw new Error(`Error al obtener el usuario: ${getUserError.message}`);

        const { data: updatedUserResponse, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { app_metadata: { ...currentUser.app_metadata, assignments: correctAssignments } }
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
        const { userId, metadata } = payload;
        if (!userId || !metadata) {
          throw new Error('El userId y los metadatos son obligatorios.');
        }

        const { data: { user: currentUser }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (getUserError) throw new Error(`Error de Supabase al obtener usuario: ${getUserError.message}`);

        // Obtener el app_metadata actual
        const currentAppMetadata = currentUser.app_metadata || {};
        const currentTenantId = payload.tenantId; // Obtener el tenantId del payload

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

        // Separar las asignaciones: las de otros tenants y la de tenant_super_admin del tenant actual
        const otherTenantAssignments = [];
        let currentTenantSuperAdminAssignment = null;

        for (const assignment of (currentAppMetadata.assignments || [])) {
          if (assignment.tenant_id !== currentTenantId) {
            otherTenantAssignments.push(assignment);
          } else if (assignment.role_id === tenantSuperAdminRoleId && assignment.branch_id === null) {
            currentTenantSuperAdminAssignment = assignment;
          }
        }

        // Crear el nuevo app_metadata con las asignaciones actualizadas
        const newAppMetadata = {
          ...currentAppMetadata,
          assignments: [
            ...otherTenantAssignments,
            ...(currentTenantSuperAdminAssignment ? [currentTenantSuperAdminAssignment] : []),
            ...(metadata.assignments || []),
          ],
        };
        
        const { data: updatedUserResponse, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { app_metadata: newAppMetadata } // Actualizar app_metadata
        );

        if (updateError) throw new Error(`Error de Supabase al actualizar metadatos: ${updateError.message}`);

        // --- Hidratar las asignaciones con nombres de roles, sucursales y tenants ---
        const hydratedAssignments = [];
        const rawAssignments = newAppMetadata.assignments || [];

        // Obtener todos los roles, sucursales y tenants de una vez
        const [{ data: allRoles, error: rolesError }, { data: allBranches, error: branchesError }, { data: allTenants, error: tenantsError }] = await Promise.all([
          supabaseAdmin.from('roles').select('id, name, display_name'),
          supabaseAdmin.from('branches').select('id, name'),
          supabaseAdmin.from('tenants').select('id, name'),
        ]);

        if (rolesError) console.warn(`Error fetching all roles:`, rolesError.message);
        if (branchesError) console.warn(`Error fetching all branches:`, branchesError.message);
        if (tenantsError) console.warn(`Error fetching all tenants:`, tenantsError.message);

        for (const assignment of rawAssignments) {
          const tenantData = allTenants?.find(t => t.id === assignment.tenant_id);
          const roleData = allRoles?.find(r => r.id === assignment.role_id);
          const branchData = allBranches?.find(b => b.id === assignment.branch_id);

          hydratedAssignments.push({
            ...assignment,
            tenant_name: tenantData?.name || null,
            role_name: roleData?.name || null,
            role_display_name: roleData?.display_name || null,
            branch_name: branchData?.name || null,
          });
        }

        // Actualizar el usuario devuelto con las asignaciones hidratadas
        const finalUser = {
          ...updatedUserResponse.user,
          app_metadata: {
            ...updatedUserResponse.user.app_metadata,
            assignments: hydratedAssignments,
          },
        };
        
        responseData = { success: true, message: 'Configuración de usuario actualizada.', user: finalUser };
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

        responseData = { success: true, metadata: user?.user_metadata };
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

        if (!email || !platformId) {
          throw new Error('El email y el platformId son obligatorios para verificar la existencia del usuario.');
        }

        const synthetic_email = `${platformId}_${email}`;

        const { data: { users }, error: findError } = await supabaseAdmin.auth.admin.listUsers({ email: synthetic_email });
        if (findError) {
          throw new Error(`Error al buscar usuario en auth.users: ${findError.message}`);
        }
        
        responseData = { success: true, exists: users && users.length > 0 };
        break;
      }

      case 'invite_or_assign_user_to_tenant': {
        console.log('Iniciando acción: invite_or_assign_user_to_tenant');
        const { email, password, tenantId, roleId, branchId, platformId, firstName, lastName } = payload;

        if (!email || !tenantId || !roleId || !branchId || !platformId) {
          throw new Error('Los campos email, tenantId, roleId, branchId y platformId son obligatorios.');
        }

        const synthetic_email = `${platformId}_${email}`;
        let userToAssign;

        // 1. Buscar o crear el usuario en auth.users
        if (password) {
          // Escenario: Nuevo usuario, se proporciona contraseña. Invocar a la acción centralizada.
          const { data: userCreationResponse, error: userCreationError } = await supabaseAdmin.functions.invoke('user-actions', {
            body: {
              action: 'create_auth_user',
              payload: {
                email: email,
                password: password,
                platformId: platformId,
              }
            }
          });

          if (userCreationError || !userCreationResponse.success) {
            throw new Error(`Error al invocar la creación de usuario: ${userCreationError?.message || userCreationResponse.message}`);
          }
          userToAssign = userCreationResponse.user;

        } else {
          // Escenario: Usuario existente, no se proporciona contraseña
          const { data: { users }, error: findError } = await supabaseAdmin.auth.admin.listUsers({ email: synthetic_email });
          if (findError || !users || users.length === 0) {
            throw new Error(`No se encontró un usuario con el email ${email} para esta plataforma.`);
          }
          userToAssign = users[0];
        }

        if (!userToAssign) {
          throw new Error('No se pudo obtener el usuario para asignar.');
        }

        // 2. Gestionar asignaciones en app_metadata
        const currentAssignments = userToAssign.app_metadata.assignments || [];

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
          branch_id: branchId,
          status: 'active', // Estado inicial de la asignación
        };

        const updatedAssignments = [...currentAssignments, newAssignment];

        const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userToAssign.id,
          { app_metadata: { ...userToAssign.app_metadata, assignments: updatedAssignments } }
        );

        if (updateError) {
          throw new Error(`Error al actualizar las asignaciones del usuario: ${updateError.message}`);
        }

        responseData = { success: true, message: 'Usuario asignado correctamente.', user: updatedUser.user };
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

        if (authError) {
          throw new Error(`Error al crear el usuario: ${authError.message}`);
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
