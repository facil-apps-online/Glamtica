-- Migration: 20250821000031_refactor_public_users_to_auth_users.sql
-- Description: Refactors all functions to use auth.users instead of public.users where appropriate,
-- and adjusts logic for roles and user metadata.

-- Function: change_password
CREATE OR REPLACE FUNCTION public.change_password(
    p_user_id uuid,
    p_current_password text,
    p_new_password text
)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user auth.users;
    v_password_matches BOOLEAN;
BEGIN
    -- 1. Verificar que el usuario exista
    SELECT * INTO v_user
    FROM auth.users u
    WHERE u.id = p_user_id;

    IF v_user.id IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Usuario no encontrado.';
        RETURN;
    END IF;

    -- 2. Verificar que la contraseña actual sea correcta
    SELECT u.encrypted_password = crypt(p_current_password, u.encrypted_password) INTO v_password_matches
    FROM auth.users u WHERE u.id = p_user_id;

    IF NOT v_password_matches THEN
        RETURN QUERY SELECT FALSE, 'La contraseña actual es incorrecta.';
        RETURN;
    END IF;

    -- 3. Actualizar con la nueva contraseña
    UPDATE auth.users
    SET encrypted_password = crypt(p_new_password, gen_salt('bf'))
    WHERE id = p_user_id;

    -- 4. Devolver éxito
    RETURN QUERY SELECT TRUE, 'Contraseña actualizada exitosamente.';

EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT FALSE, 'Ocurrió un error inesperado al cambiar la contraseña.';
END;
$$;

-- Function: check_user_exists_by_email
CREATE OR REPLACE FUNCTION public.check_user_exists_by_email(
    p_email text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM auth.users
        WHERE email = p_email
    );
END;
$$;

-- Function: create_tenant (No changes to public.users insert, relies on sync_public_user)
-- Original function is fine, as public.users is a mirror.

-- Function: disconnect_google_provider
CREATE OR REPLACE FUNCTION public.disconnect_google_provider(
    p_tenant_id uuid,
    p_provider text,
    p_requesting_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Primero, verificamos si el usuario autenticado es un superadministrador.
    -- Esta es una capa de seguridad crucial.
    IF NOT EXISTS (
        SELECT 1
        FROM auth.users u, jsonb_array_elements(u.raw_app_meta_data -> 'assignments') AS assignment
        WHERE u.id = p_requesting_user_id
          AND (assignment ->> 'role') = 'super_admin'
    ) THEN
        RETURN json_build_object('success', false, 'message', 'Acceso no autorizado. Se requiere ser superadministrador.');
    END IF;

    -- Procedemos a eliminar la integración específica para el tenant dado.
    DELETE FROM public.tenant_integrations
    WHERE tenant_id = p_tenant_id AND provider = p_provider;

    -- La variable 'FOUND' en PL/pgSQL es verdadera si la última operación (DELETE) afectó al menos una fila.
    IF FOUND THEN
        RETURN json_build_object('success', true, 'message', 'Integración desconectada correctamente.');
    ELSE
        -- Si no se encontró ninguna fila para eliminar, informamos que no existía.
        RETURN json_build_object('success', false, 'message', 'No se encontró una integración activa de este tipo para el tenant especificado.');
    END IF;

EXCEPTION
    -- Capturamos cualquier otro error que pueda ocurrir durante la ejecución.
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Ocurrió un error interno al intentar desconectar la integración.');
END;
$$;



-- Function: get_tenant_activity_summary
CREATE OR REPLACE FUNCTION public.get_tenant_activity_summary(
    p_tenant_id uuid
)
RETURNS TABLE(tenant_id uuid, tenant_name text, total_users bigint, total_clients bigint, total_appointments bigint, total_services bigint, total_products bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM auth.users u, jsonb_array_elements(u.raw_app_meta_data -> 'assignments') AS assignment
        WHERE (assignment ->> 'role') = 'super_admin'
    ) THEN
        RAISE EXCEPTION 'Acceso denegado. Solo los superadministradores pueden ver el resumen de actividad de los tenants.';
    END IF;

    RETURN QUERY
    SELECT
        t.id AS tenant_id,
        t.name AS tenant_name,
        (SELECT COUNT(DISTINCT u.id) FROM auth.users u JOIN public.user_assignments ua ON u.id = ua.user_id WHERE ua.tenant_id = t.id) AS total_users,
        (SELECT COUNT(*) FROM public.clients c WHERE c.tenant_id = t.id) AS total_clients,
        (SELECT COUNT(*) FROM public.attentions a WHERE a.tenant_id = t.id) AS total_appointments,
        (SELECT COUNT(*) FROM public.services s WHERE s.tenant_id = t.id) AS total_services,
        (SELECT COUNT(*) FROM public.products p WHERE p.tenant_id = t.id) AS total_products
    FROM
        public.tenants t
    WHERE t.id = p_tenant_id; -- Added filter for specific tenant
END;
$$;

-- Function: get_today_attentions
CREATE OR REPLACE FUNCTION public.get_today_attentions(
    p_tenant_id uuid
)
RETURNS TABLE(id uuid, attention_time time without time zone, client_name text, service_name text, stylist_name text, status text, total_price numeric)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.attention_time,
        c.name,
        s.name,
        (u.raw_user_meta_data->>'first_name') || ' ' || (u.raw_user_meta_data->>'last_name'),
        a.status,
        a.total_amount
    FROM public.attentions a
    JOIN public.clients c ON a.client_id = c.id
    JOIN public.attention_services aserv ON a.id = aserv.attention_id
    JOIN public.services s ON aserv.service_id = s.id
    JOIN auth.users u ON aserv.user_id = u.id
    WHERE a.tenant_id = p_tenant_id AND a.attention_date = CURRENT_DATE
    ORDER BY a.attention_time;
END;
$$;

-- Function: get_user_performance_report
CREATE OR REPLACE FUNCTION public.get_user_performance_report(
    p_tenant_id uuid,
    p_date_from date,
    p_date_to date
)
RETURNS TABLE(user_name text, attentions_count bigint, services_revenue numeric, products_revenue numeric)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        (u.raw_user_meta_data->>'first_name') || ' ' || (u.raw_user_meta_data->>'last_name') as user_name,
        COUNT(DISTINCT a.id) as attentions_count,
        SUM(aserv.service_price) as services_revenue,
        COALESCE(SUM(ap.total_price), 0) as products_revenue
    FROM auth.users u
    JOIN public.user_assignments ua ON u.id = ua.user_id
    LEFT JOIN public.attention_services aserv ON u.id = aserv.user_id AND aserv.tenant_id = p_tenant_id
    LEFT JOIN public.attentions a ON aserv.attention_id = a.id AND a.attention_date BETWEEN p_date_from AND p_date_to
    LEFT JOIN public.attention_products ap ON u.id = ap.user_id AND ap.tenant_id = p_tenant_id AND ap.attention_id = a.id
    WHERE ua.tenant_id = p_tenant_id
    GROUP BY u.id, u.raw_user_meta_data; -- Group by raw_user_meta_data to get first_name and last_name
END;
$$;

-- Function: link_user_to_tenant (No changes to public.users insert, relies on sync_public_user)
-- Original function is fine, as public.users is a mirror.
CREATE OR REPLACE FUNCTION public.link_user_to_tenant(
    p_invoking_user_role text,
    p_tenant_id uuid,
    p_email text,
    p_first_name text,
    p_last_name text,
    p_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    existing_user_id UUID;
    user_id_to_link UUID;
BEGIN
    -- 1. Guarda de Seguridad de Rol
    IF p_invoking_user_role NOT IN ('super_admin', 'tenant_super_admin', 'tenant_admin') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Acceso denegado. Permisos insuficientes.');
    END IF;

    -- 2. Lógica de Creación o Vinculación de Usuario
    SELECT id INTO existing_user_id FROM auth.users WHERE email = p_email;

    IF existing_user_id IS NULL THEN
        -- Usuario no existe, crearlo
        IF p_password IS NULL OR p_password = '' THEN
            RETURN jsonb_build_object('success', false, 'message', 'La contraseña es obligatoria para nuevos usuarios.');
        END IF;

        -- Insert into public.users, assuming sync_public_user handles auth.users sync
        INSERT INTO public.users (email, first_name, last_name, password_hash)
        VALUES (p_email, p_first_name, p_last_name, crypt(p_password, gen_salt('bf')))
        RETURNING id INTO user_id_to_link;
    ELSE
        -- Usuario ya existe
        user_id_to_link := existing_user_id;
    END IF;

    -- 3. Verificar si el usuario ya está vinculado a este tenant
    IF EXISTS (
        SELECT 1 FROM public.user_assignments
        WHERE user_id = user_id_to_link AND tenant_id = p_tenant_id
    ) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Este usuario ya es miembro de este negocio.');
    END IF;

    -- 4. Crear la asignación 'pendiente'
    INSERT INTO public.user_assignments (user_id, tenant_id, status)
    VALUES (user_id_to_link, p_tenant_id, 'pending_configuration');

    -- 5. Devolver éxito
    RETURN jsonb_build_object('success', true, 'message', 'Usuario vinculado correctamente. Ahora puedes configurar sus asignaciones.');

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', 'Ha ocurrido un error inesperado: ' || SQLERRM);
END;
$$;

-- Function: login_user
CREATE OR REPLACE FUNCTION public.login_user(
    p_email text,
    p_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
    user_assignments jsonb;
    has_active_assignment BOOLEAN;
BEGIN
    -- 1. Verificar credenciales del usuario
    SELECT
        u.id,
        u.encrypted_password,
        u.raw_user_meta_data->>'first_name' as first_name,
        u.raw_user_meta_data->>'last_name' as last_name,
        u.raw_user_meta_data->>'avatar_url' as avatar_url,
        (u.raw_user_meta_data->>'country_id')::uuid as country_id,
        (u.raw_user_meta_data->>'language_id')::uuid as language_id,
        (u.raw_user_meta_data->>'currency_id')::uuid as currency_id,
        (u.raw_user_meta_data->>'timezone_id')::uuid as timezone_id
    INTO
        user_record
    FROM
        auth.users u
    WHERE
        u.email = p_email;

    IF user_record.id IS NULL OR user_record.encrypted_password IS NULL OR crypt(p_password, user_record.encrypted_password) <> user_record.encrypted_password THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid credentials');
    END IF;

    -- 2. Verificar si el usuario tiene al menos una asignación activa
    SELECT EXISTS (
        SELECT 1
        FROM public.user_assignments ua
        WHERE ua.user_id = user_record.id AND ua.status = 'active'
    ) INTO has_active_assignment;

    IF NOT has_active_assignment THEN
        RETURN jsonb_build_object('success', false, 'message', 'User does not have any active assignments.');
    END IF;

    -- 3. Obtener todas las asignaciones del usuario, incluyendo el estado
    SELECT jsonb_agg(
        jsonb_build_object(
            'assignment_id', ua.id,
            'tenant_id', ua.tenant_id,
            'tenant_name', t.name,
            'role_id', ua.role_id,
            'role_name', r.name,
            'branch_id', ua.branch_id,
            'branch_name', b.name,
            'status', ua.status -- <<< CAMPO AÑADIDO
        )
    )
    INTO user_assignments
    FROM public.user_assignments ua
    JOIN public.roles r ON ua.role_id = r.id
    JOIN public.tenants t ON ua.tenant_id = t.id
    LEFT JOIN public.branches b ON ua.branch_id = b.id
    WHERE ua.user_id = user_record.id;

    -- 4. Construir la respuesta final
    RETURN jsonb_build_object(
        'success', true,
        'profile', jsonb_build_object(
            'id', user_record.id,
            'email', p_email,
            'first_name', user_record.first_name,
            'last_name', user_record.last_name,
            'avatar_url', user_record.avatar_url,
            'country_id', user_record.country_id,
            'language_id', user_record.language_id,
            'currency_id', user_record.currency_id,
            'timezone_id', user_record.timezone_id
        ),
        'assignments', COALESCE(user_assignments, '[]'::jsonb)
    );
END;
$$;

-- Function: register_new_tenant (No changes to public.users insert, relies on sync_public_user)
-- Original function is fine, as public.users is a mirror.

-- Function: trigger_system_email
CREATE OR REPLACE FUNCTION public.trigger_system_email(
    p_recipient_user_id uuid,
    p_template_type text,
    p_template_data jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_send_result JSONB;
    v_recipient_email TEXT;
    v_language_id UUID;
    v_tenant_id UUID;
    v_template_id UUID;
    v_template_subject TEXT;
    v_template_body_html TEXT;
    v_processed_subject TEXT;
    v_processed_body_html TEXT;
    v_is_tenant_sending_active BOOLEAN;
    v_key TEXT;
    v_value TEXT;
    v_default_language_id UUID;
BEGIN
    SELECT id INTO v_default_language_id FROM public.languages WHERE iso_code = 'es-CO';

    SELECT u.email, (u.raw_user_meta_data->>'language_id')::uuid, (u.raw_app_meta_data->'assignments'->0->>'tenant_id')::uuid
    INTO v_recipient_email, v_language_id, v_tenant_id
    FROM auth.users u
    WHERE u.id = p_recipient_user_id;

    IF NOT FOUND THEN
        INSERT INTO public.email_logs (tenant_id, recipient_email, status, error_message)
        VALUES ('00000000-0000-0000-0000-000000000000', 'unknown_user', 'FAILED', 'Recipient user with ID ' || p_recipient_user_id || ' not found.');
        RETURN;
    END IF;

    IF v_tenant_id IS NOT NULL THEN
        SELECT is_active INTO v_is_tenant_sending_active
        FROM public.tenant_template_settings
        WHERE tenant_id = v_tenant_id AND template_type = p_template_type;

        IF v_is_tenant_sending_active IS NULL OR v_is_tenant_sending_active = false THEN
            IF p_template_type NOT IN ('WELCOME_USER', 'PASSWORD_RESET') THEN
                RETURN;
            END IF;
        END IF;
    END IF;

    SELECT id, subject, body_html INTO v_template_id, v_template_subject, v_template_body_html
    FROM public.email_templates
    WHERE tenant_id = '00000000-0000-0000-0000-000000000000'
      AND template_type = p_template_type
      AND language_id = v_language_id
      AND is_active = true;

    IF NOT FOUND THEN
        INSERT INTO public.email_logs (tenant_id, recipient_email, status, error_message)
        VALUES (COALESCE(v_tenant_id, '00000000-0000-0000-0000-000000000000'), v_recipient_email, 'FAILED', 'Active master template not found for type ' || p_template_type || ' and language_id ' || v_language_id);
        RETURN;
    END IF;

    v_processed_subject := v_template_subject;
    v_processed_body_html := v_template_body_html;

    FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_template_data)
    LOOP
        v_processed_subject := replace(v_processed_subject, '{{' || v_key || '}}', v_value);
        v_processed_body_html := replace(v_processed_body_html, '{{' || v_key || '}}', v_value);
    END LOOP;

    v_send_result := private.send_email_via_gmail_api(v_recipient_email, v_processed_subject, v_processed_body_html);

    IF (v_send_result->>'success')::BOOLEAN THEN
        INSERT INTO public.email_logs (tenant_id, recipient_email, template_id, status)
        VALUES (COALESCE(v_tenant_id, '00000000-0000-0000-0000-000000000000'), v_recipient_email, v_template_id, 'SENT');
    ELSE
        INSERT INTO public.email_logs (tenant_id, recipient_email, template_id, status, error_message)
        VALUES (COALESCE(v_tenant_id, '00000000-0000-0000-0000-000000000000'), v_recipient_email, v_template_id, 'FAILED', v_send_result->>'error');
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        INSERT INTO public.email_logs (tenant_id, recipient_email, template_id, status, error_message)
        VALUES ('00000000-0000-0000-0000-000000000000', COALESCE(v_recipient_email, 'unknown'), v_template_id, 'FAILED', SQLERRM);
END;
$$;

-- Function: trigger_test_email_for_tenant
CREATE OR REPLACE FUNCTION public.trigger_test_email_for_tenant(
    p_tenant_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_super_admin_user RECORD;
    v_full_name TEXT;
BEGIN
    -- Encontrar al super_admin del sistema
    SELECT u.id, (u.raw_user_meta_data->>'first_name') as first_name, (u.raw_user_meta_data->>'last_name') as last_name
    INTO v_super_admin_user
    FROM auth.users u, jsonb_array_elements(u.raw_app_meta_data -> 'assignments') AS assignment
    WHERE (assignment ->> 'role') = 'super_admin'
    LIMIT 1;

    IF v_super_admin_user.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'No se encontró al usuario super_admin del sistema.');
    END IF;

    -- Construir el nombre completo
    v_full_name := TRIM(COALESCE(v_super_admin_user.first_name, '') || ' ' || COALESCE(v_super_admin_user.last_name, ''));
    IF v_full_name = '' THEN
        v_full_name := 'Super Administrador';
    END IF;

    -- Llamar a la función principal de envío de correos
    PERFORM public.trigger_system_email(
        p_recipient_user_id := v_super_admin_user.id,
        p_template_type := 'WELCOME_USER',
        p_template_data := jsonb_build_object('user_name', v_full_name)
    );

    RETURN jsonb_build_object('success', true, 'message', 'El correo de prueba ha sido puesto en la cola de envío.');

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', 'Error inesperado: ' || SQLERRM);
END;
$$;

-- Function: update_password_with_token
CREATE OR REPLACE FUNCTION public.update_password_with_token(
    p_token text,
    p_new_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    token_record RECORD;
BEGIN
    -- 1. Find the token in the table
    SELECT * INTO token_record
    FROM public.password_reset_tokens
    WHERE token = p_token;

    -- 2. Validate the token
    IF token_record.id IS NULL THEN
        RAISE EXCEPTION 'Token inválido o no encontrado.';
    END IF;

    IF token_record.used_at IS NOT NULL THEN
        RAISE EXCEPTION 'Este token ya ha sido utilizado.';
    END IF;

    IF token_record.expires_at < now() THEN
        RAISE EXCEPTION 'Este token ha expirado.';
    END IF;

    -- 3. Update the user's password in auth.users table
    UPDATE auth.users
    SET encrypted_password = crypt(p_new_password, gen_salt('bf'))
    WHERE id = token_record.user_id;

    -- 4. Mark the token as used
    UPDATE public.password_reset_tokens
    SET used_at = now()
    WHERE id = token_record.id;

    -- 5. Return a success message
    RETURN json_build_object(
        'success', TRUE,
        'message', 'Contraseña actualizada correctamente.'
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Ocurrió un error inesperado: %', SQLERRM;
END;
$$;

-- Function: update_user_active_status
CREATE OR REPLACE FUNCTION public.update_user_active_status(
    target_user_id uuid,
    p_is_active boolean,
    p_user_role text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Security check: only super_admin can perform this action
  IF p_user_role != 'super_admin' THEN
    RAISE EXCEPTION 'Access denied. Super admin role required.';
  END IF;

  -- Update the is_active flag in auth.users table
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{is_active}',
      to_jsonb(p_is_active),
      true
  )
  WHERE id = target_user_id;

  -- Return a success confirmation
  RETURN json_build_object('success', TRUE, 'message', 'User status updated successfully.');
END;
$$;

-- Function: update_user_password
CREATE OR REPLACE FUNCTION public.update_user_password(
    p_old_password text,
    p_new_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
    current_user_id UUID;
BEGIN
    -- 1. Get the current user's ID from the session context
    current_user_id := (current_setting('app.current_user_id', TRUE)::uuid);

    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'No active user session found.';
    END IF;

    -- 2. Find the user in auth.users table
    SELECT * INTO user_record
    FROM auth.users
    WHERE id = current_user_id;

    -- 3. Verify the old password
    IF user_record.encrypted_password IS NULL OR crypt(p_old_password, user_record.encrypted_password) <> user_record.encrypted_password THEN
        RAISE EXCEPTION 'La contraseña actual es incorrecta.';
    END IF;

    -- 4. Update to the new password
    UPDATE auth.users
    SET encrypted_password = crypt(p_new_password, gen_salt('bf'))
    WHERE id = current_user_id;

    -- 5. Return a success message
    RETURN json_build_object('success', TRUE, 'message', 'Contraseña actualizada correctamente.');

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Ocurrió un error inesperado: %', SQLERRM;
END;
$$;

-- Function: update_user_profile
CREATE OR REPLACE FUNCTION public.update_user_profile(
    p_user_id uuid,
    p_first_name text,
    p_last_name text,
    p_avatar_url text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE auth.users
    SET
        raw_user_meta_data = jsonb_set(
            COALESCE(raw_user_meta_data, '{}'::jsonb),
            '{first_name}', to_jsonb(p_first_name),
            true
        ),
        raw_user_meta_data = jsonb_set(
            COALESCE(raw_user_meta_data, '{}'::jsonb),
            '{last_name}', to_jsonb(p_last_name),
            true
        ),
        raw_user_meta_data = jsonb_set(
            COALESCE(raw_user_meta_data, '{}'::jsonb),
            '{avatar_url}', to_jsonb(p_avatar_url),
            true
        )
    WHERE
        id = p_user_id;

    RETURN json_build_object('success', TRUE, 'message', 'Perfil actualizado correctamente.');

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Ocurrió un error inesperado: %', SQLERRM;
END;
$$;

-- Function: update_user_regional_settings
CREATE OR REPLACE FUNCTION public.update_user_regional_settings(
    p_user_id uuid,
    p_country_id uuid,
    p_language_id uuid,
    p_currency_id uuid,
    p_timezone_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE auth.users
    SET
        raw_user_meta_data = jsonb_set(
            COALESCE(raw_user_meta_data, '{}'::jsonb),
            '{country_id}', to_jsonb(p_country_id),
            true
        ),
        raw_user_meta_data = jsonb_set(
            raw_user_meta_data,
            '{language_id}', to_jsonb(p_language_id),
            true
        ),
        raw_user_meta_data = jsonb_set(
            raw_user_meta_data,
            '{currency_id}', to_jsonb(p_currency_id),
            true
        ),
        raw_user_meta_data = jsonb_set(
            raw_user_meta_data,
            '{timezone_id}', to_jsonb(p_timezone_id),
            true
        ),
        updated_at = now()
    WHERE id = p_user_id;
END;
$$;
