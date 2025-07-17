
/*
  # Actualizar Funciones de Contexto de Usuario para JWT Personalizado

  1. Update Functions
    - `get_current_user_id()`: Leer `sub` del JWT o `app.current_user_id`
    - `get_current_tenant_id()`: Leer `tenant_id` del JWT o `app.current_tenant_id`
    - `get_current_branch_id()`: Leer `branch_id` del JWT o `app.current_branch_id`
    - `get_current_role_name()`: Leer `role` del JWT o `app.current_role_name`

  2. Security
    - Ensure `SECURITY INVOKER` for these functions to respect RLS
*/

-- Actualizar get_current_user_id()
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', TRUE)::jsonb ->> 'sub')::uuid,
    NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID
  );
$$ LANGUAGE SQL STABLE SECURITY INVOKER;

-- Actualizar get_current_tenant_id()
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', TRUE)::jsonb ->> 'tenant_id')::uuid,
    NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID
  );
$$ LANGUAGE SQL STABLE SECURITY INVOKER;

-- Actualizar get_current_branch_id()
CREATE OR REPLACE FUNCTION get_current_branch_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', TRUE)::jsonb ->> 'branch_id')::uuid,
    NULLIF(current_setting('app.current_branch_id', TRUE), '')::UUID
  );
$$ LANGUAGE SQL STABLE SECURITY INVOKER;

-- Actualizar get_current_role_name()
CREATE OR REPLACE FUNCTION get_current_role_name()
RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', TRUE)::jsonb ->> 'role',
    NULLIF(current_setting('app.current_role_name', TRUE), '')
  );
$$ LANGUAGE SQL STABLE SECURITY INVOKER;
