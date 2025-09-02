-- Migration: 20250821000032_refactor_remaining_functions.sql
-- Description: Refactors the remaining functions to use auth.users and raw_user_meta_data where appropriate.

-- Function: create_tenant (No changes to public.users insert, relies on sync_public_user)
-- Original function is fine, as public.users is a mirror.

-- Function: get_branch_commission_matrix
CREATE OR REPLACE FUNCTION public.get_branch_commission_matrix(
    branch_id_param uuid,
    tenant_id_param uuid
)
RETURNS TABLE(item_id uuid, item_name text, item_type text, users json)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH branch_products AS (
    SELECT bp.product_id as id, p.name, 'product' as type
    FROM public.branch_products bp
    JOIN public.products p ON bp.product_id = p.id
    WHERE bp.branch_id = branch_id_param AND bp.tenant_id = tenant_id_param
  ),
  branch_services AS (
    SELECT bs.service_id as id, s.name, 'service' as type
    FROM public.branch_services bs
    JOIN public.services s ON bs.service_id = s.id
    WHERE bs.branch_id = branch_id_param AND bs.tenant_id = tenant_id_param
  ),
  all_items_in_branch AS (
    SELECT id, name, type FROM branch_products
    UNION ALL
    SELECT id, name, type FROM branch_services
  ),
  relevant_users AS (
    SELECT DISTINCT ua.user_id, (u.raw_user_meta_data->>'first_name') || ' ' || (u.raw_user_meta_data->>'last_name') as user_name
    FROM public.user_assignments ua
    JOIN auth.users u ON ua.user_id = u.id
    WHERE ua.branch_id = branch_id_param AND ua.tenant_id = tenant_id_param
  ),
  commission_matrix AS (
    SELECT
      ai.id as item_id,
      ai.name as item_name,
      ai.type as item_type,
      ru.user_id,
      ru.user_name
    FROM all_items_in_branch ai
    CROSS JOIN relevant_users ru
  )
  SELECT
    cm.item_id,
    cm.item_name,
    cm.item_type,
    json_agg(
      json_build_object(
        'user_id', cm.user_id,
        'user_name', cm.user_name,
        'commission_rate',
          CASE
            WHEN cm.item_type = 'product' THEN pc.commission_rate
            WHEN cm.item_type = 'service' THEN sc.commission_rate
            ELSE NULL
          END,
        'can_perform',
          CASE
            WHEN cm.item_type = 'service' THEN sc.can_perform
            ELSE NULL
          END,
        'commission_id',
          CASE
            WHEN cm.item_type = 'product' THEN pc.id
            WHEN cm.item_type = 'service' THEN sc.id
            ELSE NULL
          END
      )
    )::json as users
  FROM commission_matrix cm
  LEFT JOIN public.product_user_commissions pc
    ON cm.item_id = pc.product_id
    AND cm.user_id = pc.user_id
    AND branch_id_param = pc.branch_id
  LEFT JOIN public.service_user_commissions sc
    ON cm.item_id = sc.service_id
    AND cm.user_id = sc.user_id
    AND branch_id_param = sc.branch_id
  GROUP BY cm.item_id, cm.item_name, cm.item_type;
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
    IF NOT public.is_super_admin() THEN
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
    WHERE t.id = p_tenant_id;
END;
$$;

-- Function: link_user_to_tenant
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

-- Function: register_new_tenant (No changes to public.users insert, relies on sync_public_user)
-- Original function is fine, as public.users is a mirror.

-- Function: sync_public_user (No changes, this function is correct)
