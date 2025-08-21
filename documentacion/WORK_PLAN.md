-- Migración para corregir las funciones de matriz de comisiones de productos y servicios.

-- Corrección para get_product_commission_matrix
CREATE OR REPLACE FUNCTION get_product_commission_matrix(
  product_id_param uuid,
  tenant_id_param uuid
)
RETURNS TABLE(user_id uuid, user_name text, branches json) AS $$
BEGIN
  RETURN QUERY
  WITH relevant_branches AS (
    -- 1. Encontrar todas las sucursales donde el producto está activo
    SELECT id as branch_id, name as branch_name
    FROM public.branches
    WHERE id IN (
      SELECT branch_id FROM public.branch_products
      WHERE product_id = product_id_param AND tenant_id = tenant_id_param -- CORRECCIÓN: master_product_id cambiado a product_id
    )
  ),
  relevant_users AS (
    -- 2. Encontrar todos los usuarios que trabajan en esas sucursales
    SELECT DISTINCT u.id as user_id, u.first_name || ' ' || u.last_name as user_name
    FROM public.users u
    JOIN public.user_assignments ua ON u.id = ua.user_id
    WHERE ua.branch_id IN (SELECT branch_id FROM relevant_branches)
      AND ua.tenant_id = tenant_id_param
  ),
  commission_matrix AS (
    -- 3. Crear la matriz de todas las combinaciones posibles de usuario/sucursal
    SELECT
      ru.user_id,
      ru.user_name,
      rb.branch_id,
      rb.branch_name
    FROM relevant_users ru
    CROSS JOIN relevant_branches rb
  )
  -- 4. Unir con comisiones existentes y agregar
  SELECT
    cm.user_id,
    cm.user_name,
    json_agg(
      json_build_object(
        'branch_id', cm.branch_id,
        'branch_name', cm.branch_name,
        'commission_id', pc.id,
        'commission_rate', pc.commission_rate
      )
    ) as branches
  FROM commission_matrix cm
  LEFT JOIN public.product_commissions pc
    ON cm.user_id = pc.user_id
    AND cm.branch_id = pc.branch_id
    AND pc.product_id = product_id_param
  GROUP BY cm.user_id, cm.user_name;
END;
$$ LANGUAGE plpgsql;

-- Corrección para get_service_commission_matrix
CREATE OR REPLACE FUNCTION get_service_commission_matrix(
  service_id_param uuid,
  tenant_id_param uuid
)
RETURNS TABLE(user_id uuid, user_name text, branches json) AS $$
BEGIN
  RETURN QUERY
  WITH relevant_branches AS (
    -- 1. Find all branches where the service is active
    SELECT id as branch_id, name as branch_name
    FROM public.branches
    WHERE id IN (
      SELECT branch_id FROM public.branch_services
      WHERE service_id = service_id_param AND tenant_id = tenant_id_param -- CORRECCIÓN: master_service_id cambiado a service_id
    )
  ),
  relevant_users AS (
    -- 2. Find all users who work in those branches
    SELECT DISTINCT u.id as user_id, u.first_name || ' ' || u.last_name as user_name
    FROM public.users u
    JOIN public.user_assignments ua ON u.id = ua.user_id
    WHERE ua.branch_id IN (SELECT branch_id FROM relevant_branches)
      AND ua.tenant_id = tenant_id_param
  ),
  commission_matrix AS (
    -- 3. Create the matrix of all possible user/branch combinations
    SELECT
      ru.user_id,
      ru.user_name,
      rb.branch_id,
      rb.branch_name
    FROM relevant_users ru
    CROSS JOIN relevant_branches rb
  )
  -- 4. Join with existing commissions and aggregate
  SELECT
    cm.user_id,
    cm.user_name,
    json_agg(
      json_build_object(
        'branch_id', cm.branch_id,
        'branch_name', cm.branch_name,
        'commission_id', sc.id,
        'commission_rate', sc.commission_rate,
        'can_perform', sc.can_perform
      )
    ) as branches
  FROM commission_matrix cm
  LEFT JOIN public.service_user_commissions sc
    ON cm.user_id = sc.user_id
    AND cm.branch_id = sc.branch_id
    AND sc.service_id = service_id_param
  GROUP BY cm.user_id, cm.user_name;
END;
$$ LANGUAGE plpgsql;

-- Correcciones en el módulo de Atenciones

-- 1. `useAttentions.ts`:
--    - Se corrigió la lógica de filtrado por `userId` para que funcione correctamente con las tablas anidadas de Supabase. Se utilizó `!inner` para asegurar un `INNER JOIN` y que el filtro en `attention_services` afecte a las `attentions` devueltas.

-- 2. `useAttentionServices.ts`:
--    - Se añadió la invalidación de la query `['attention-dates']` en la mutación `useAddAttentionService`. Esto asegura que la vista del calendario se actualice correctamente cuando se añade un nuevo servicio a una atención.

-- 3. `AttentionDialog.tsx`:
--    - Se resetea el `user_id` seleccionado cuando se cambia el `service_id` en el formulario de servicio. Esto previene que un usuario incorrecto quede seleccionado.
--    - Se añadió un ID único a cada servicio en el estado del formulario para usarlo como `key` en el componente `ServiceFormCard`, mejorando la performance y estabilidad de React.
--    - Se añadió un indicador de carga en el selector de usuarios mientras se obtienen los usuarios disponibles, mejorando la experiencia de usuario.

-- 4. `useAvailableUsers.ts`:
--    - Se identificó un problema de performance: el hook realiza una llamada a la base de datos por cada usuario para verificar su disponibilidad. Se recomienda refactorizar esto en una única función de base de datos en el futuro para mejorar la escalabilidad.

-- 5. Refactorización a Edge Function `tenant-actions`:
--    - Se centralizaron todas las llamadas a la base de datos del módulo de atenciones en la Edge Function `tenant-actions`.
--    - Se crearon los `case` necesarios en la Edge Function para manejar las operaciones de atenciones.
--    - Se refactorizaron los hooks `useAttentions`, `useAttentionServices` y `useAvailableUsers` para que utilicen `callTenantAction`.

-- Plan de Desarrollo: Sistema de Pantalla de Turnos (TV Turn Display) - Completado
-- Fecha de finalización: jueves, 21 de agosto de 2025
