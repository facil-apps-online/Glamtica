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

        if (!data.session) {
            throw new Error('Inicio de sesión fallido, no se recibió una sesión.');
        }

        responseData = { success: true, ...data };
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
        const targetAssignmentIndex = assignments.findIndex(a => a.assignment_id === newAssignmentId);

        if (targetAssignmentIndex === -1) {
          throw new Error('La asignación seleccionada no es válida para este usuario.');
        }

        const newAssignmentsOrder = [...assignments];
        const [targetAssignment] = newAssignmentsOrder.splice(targetAssignmentIndex, 1);
        newAssignmentsOrder.unshift(targetAssignment);

        const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { app_metadata: { ...user.app_metadata, assignments: newAssignmentsOrder } }
        );

        if (updateError) throw new Error(`Error al actualizar app_metadata: ${updateError.message}`);

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

        const mergedMetadata = { ...currentUser.user_metadata, ...metadata };
        
        const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { user_metadata: mergedMetadata }
        );

        if (updateError) throw new Error(`Error de Supabase al actualizar metadatos: ${updateError.message}`);
        
        responseData = { success: true, message: 'Configuración de usuario actualizada.', user: updatedUser.user };
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
        const { email } = payload;
        if (!email) throw new Error('El email es obligatorio.');

        const { data: { users }, error: findError } = await supabaseAdmin.auth.admin.listUsers({ email });
        if (findError) throw new Error(`Error de Supabase al buscar usuario: ${findError.message}`);
        if (!users || users.length === 0) throw new Error('No se encontró un usuario con ese correo electrónico.');
        
        const user = users[0];
        const token = crypto.randomUUID();

        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          user.id,
          { user_metadata: { ...user.user_metadata, recovery_token: token, recovery_sent_at: new Date().toISOString() } }
        );

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
