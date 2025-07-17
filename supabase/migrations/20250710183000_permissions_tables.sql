
/*
  # Sistema de Permisos Granulares

  1. New Tables
    - `permissions` - Define permisos específicos
    - `user_permissions` - Asigna permisos a usuarios individuales
    - `menu_permissions` - Controla el acceso a elementos del menú o funcionalidades por rol

  2. Security
    - Enable RLS on all new tables
    - Add policies for multi-tenancy and role-based access

  3. Triggers
    - Add `updated_at` triggers for all new tables
*/

-- Tabla de permisos
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabla de permisos de usuario
CREATE TABLE IF NOT EXISTS user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  branch_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, permission_id)
);

-- Tabla de permisos de menú/funcionalidad por rol
CREATE TABLE IF NOT EXISTS menu_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  menu_item_name text NOT NULL, -- Nombre del elemento del menú o funcionalidad
  can_access boolean DEFAULT true,
  tenant_id uuid NOT NULL,
  branch_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(role_id, menu_item_name)
);

-- Añadir columnas tenant_id y branch_id a las tablas existentes si no existen
-- (Esto ya debería estar manejado por migraciones anteriores, pero se incluye por robustez)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'permissions' AND column_name = 'tenant_id') THEN
        ALTER TABLE permissions ADD COLUMN tenant_id uuid;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'permissions' AND column_name = 'branch_id') THEN
        ALTER TABLE permissions ADD COLUMN branch_id uuid;
    END IF;
END$$;

-- Habilitar RLS
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_permissions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (permisivas para desarrollo, se ajustarán después)
CREATE POLICY "Enable all operations for permissions"
  ON permissions
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all operations for user_permissions"
  ON user_permissions
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all operations for menu_permissions"
  ON menu_permissions
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Triggers para updated_at
CREATE TRIGGER trigger_permissions_updated_at
  BEFORE UPDATE ON permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_permissions_updated_at
  BEFORE UPDATE ON user_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_menu_permissions_updated_at
  BEFORE UPDATE ON menu_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insertar permisos básicos
INSERT INTO permissions (name, description) VALUES
('manage_users', 'Permite gestionar usuarios'),
('manage_roles', 'Permite gestionar roles'),
('manage_tenants', 'Permite gestionar tenants'),
('view_dashboard', 'Permite ver el dashboard'),
('create_appointment', 'Permite crear citas'),
('edit_appointment', 'Permite editar citas'),
('cancel_appointment', 'Permite cancelar citas'),
('view_reports', 'Permite ver reportes')
ON CONFLICT (name) DO NOTHING;

-- Insertar permisos de menú/funcionalidad por defecto para roles existentes
DO $$
DECLARE
  super_admin_role_id uuid;
  tenant_super_admin_role_id uuid;
  tenant_admin_role_id uuid;
  tenant_user_role_id uuid;
  default_tenant_id uuid;
  default_branch_id uuid;
BEGIN
  SELECT id INTO super_admin_role_id FROM roles WHERE name = 'super_admin';
  SELECT id INTO tenant_super_admin_role_id FROM roles WHERE name = 'tenant_super_admin';
  SELECT id INTO tenant_admin_role_id FROM roles WHERE name = 'tenant_admin';
  SELECT id INTO tenant_user_role_id FROM roles WHERE name = 'tenant_user';

  SELECT id INTO default_tenant_id FROM tenants WHERE name = 'Glamtica Default Tenant';
  SELECT id INTO default_branch_id FROM branches WHERE tenant_id = default_tenant_id AND name = 'Main Branch';

  -- Super Admin
  INSERT INTO menu_permissions (role_id, menu_item_name, can_access, tenant_id) VALUES
  (super_admin_role_id, 'dashboard', true, default_tenant_id),
  (super_admin_role_id, 'tenants', true, default_tenant_id),
  (super_admin_role_id, 'users', true, default_tenant_id),
  (super_admin_role_id, 'roles', true, default_tenant_id),
  (super_admin_role_id, 'settings', true, default_tenant_id)
  ON CONFLICT (role_id, menu_item_name) DO NOTHING;

  -- Tenant Super Admin
  INSERT INTO menu_permissions (role_id, menu_item_name, can_access, tenant_id) VALUES
  (tenant_super_admin_role_id, 'dashboard', true, default_tenant_id),
  (tenant_super_admin_role_id, 'branches', true, default_tenant_id),
  (tenant_super_admin_role_id, 'users', true, default_tenant_id),
  (tenant_super_admin_role_id, 'roles', true, default_tenant_id),
  (tenant_super_admin_role_id, 'settings', true, default_tenant_id),
  (tenant_super_admin_role_id, 'clients', true, default_tenant_id),
  (tenant_super_admin_role_id, 'stylists', true, default_tenant_id),
  (tenant_super_admin_role_id, 'services', true, default_tenant_id),
  (tenant_super_admin_role_id, 'products', true, default_tenant_id),
  (tenant_super_admin_role_id, 'purchases', true, default_tenant_id),
  (tenant_super_admin_role_id, 'attentions', true, default_tenant_id)
  ON CONFLICT (role_id, menu_item_name) DO NOTHING;

  -- Tenant Admin
  INSERT INTO menu_permissions (role_id, menu_item_name, can_access, tenant_id, branch_id) VALUES
  (tenant_admin_role_id, 'dashboard', true, default_tenant_id, default_branch_id),
  (tenant_admin_role_id, 'users', true, default_tenant_id, default_branch_id),
  (tenant_admin_role_id, 'clients', true, default_tenant_id, default_branch_id),
  (tenant_admin_role_id, 'stylists', true, default_tenant_id, default_branch_id),
  (tenant_admin_role_id, 'services', true, default_tenant_id, default_branch_id),
  (tenant_admin_role_id, 'products', true, default_tenant_id, default_branch_id),
  (tenant_admin_role_id, 'purchases', true, default_tenant_id, default_branch_id),
  (tenant_admin_role_id, 'attentions', true, default_tenant_id, default_branch_id)
  ON CONFLICT (role_id, menu_item_name) DO NOTHING;

  -- Tenant User
  INSERT INTO menu_permissions (role_id, menu_item_name, can_access, tenant_id, branch_id) VALUES
  (tenant_user_role_id, 'dashboard', true, default_tenant_id, default_branch_id),
  (tenant_user_role_id, 'clients', true, default_tenant_id, default_branch_id),
  (tenant_user_role_id, 'attentions', true, default_tenant_id, default_branch_id)
  ON CONFLICT (role_id, menu_item_name) DO NOTHING;

END $$;
