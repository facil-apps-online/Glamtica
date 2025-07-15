### Finalización del Sistema de Autenticación Personalizado

Se ha implementado y verificado el sistema de autenticación personalizado, cumpliendo con las 'Notas Técnicas Críticas' del proyecto. Esto incluye:

-   **Hashing Seguro de Contraseñas:** Utilizando `pgcrypto.crypt` para el almacenamiento seguro de contraseñas.
-   **Gestión de Usuarios y Roles:** A través de tablas propias (`public.users`, `public.roles`).
-   **Generación de JWT Personalizado:** Mediante una Edge Function (`generate-jwt`) que firma JWTs con claims personalizados (user_id, email, role, tenant_id, branch_id, audience).
-   **Flujo de Login/Registro:** Implementado en el frontend (`Auth.tsx`) llamando a funciones RPC de PostgreSQL (`register_new_tenant`, `login_user`).
-   **Manejo de Sesión en Frontend:** Gestión manual del JWT en `localStorage` y configuración del cliente de Supabase para adjuntar el token a las solicitudes.
-   **Protección de Rutas:** Componente `ProtectedRoute` que valida la presencia del JWT para el acceso a rutas protegidas.

**Estado:** Completado y verificado.

---

## 1.1 Diseño y Creación del Esquema de Base de Datos

### 1.1.1 Tablas Principales del Sistema

Las siguientes tablas son fundamentales para la estructura del sistema y la gestión de usuarios y tenants:

```sql
-- Table: tenants
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subscription_status TEXT NOT NULL DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'inactive', 'cancelled')),
  default_language_code TEXT REFERENCES public.languages(iso_code) ON UPDATE CASCADE ON DELETE SET NULL,
  default_currency_id UUID REFERENCES public.currencies(id) ON UPDATE CASCADE ON DELETE SET NULL,
  default_timezone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: branches (anteriormente tenant_sites)
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  language_code TEXT REFERENCES public.languages(iso_code) ON UPDATE CASCADE ON DELETE SET NULL,
  currency_id UUID REFERENCES public.currencies(id) ON UPDATE CASCADE ON DELETE SET NULL,
  timezone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: roles
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE CHECK (name IN ('super_admin', 'tenant_super_admin', 'tenant_admin', 'tenant_user')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL, -- Store hashed password
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE, -- NULL for super_admin
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE, -- NULL for super_admin and tenant_super_admin
  language_code TEXT REFERENCES public.languages(iso_code) ON UPDATE CASCADE ON DELETE SET NULL,
  currency_id UUID REFERENCES public.currencies(id) ON UPDATE CASCADE ON DELETE SET NULL,
  timezone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

### 1.1.2 Tablas de Negocio

Las siguientes tablas gestionan los datos operativos del negocio:

```sql
-- Table: clients
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: stylists
CREATE TABLE IF NOT EXISTS public.stylists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  specialties TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: services
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  duration_minutes INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  average_cost NUMERIC NOT NULL DEFAULT 0,
  last_purchase_cost NUMERIC NOT NULL DEFAULT 0,
  cost_price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: attentions (nueva estructura de citas)
CREATE TABLE IF NOT EXISTS public.attentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  attention_date DATE NOT NULL,
  attention_time TIME WITHOUT TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Confirmada',
  notes TEXT,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE
);

-- Table: attention_services (servicios dentro de una atención)
CREATE TABLE IF NOT EXISTS public.attention_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attention_id UUID NOT NULL REFERENCES public.attentions(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  stylist_id UUID NOT NULL REFERENCES public.stylists(id) ON DELETE CASCADE,
  service_price NUMERIC NOT NULL,
  service_order INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'Pendiente',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE
);

-- Table: service_sessions (sesiones de servicios)
CREATE TABLE IF NOT EXISTS public.service_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attention_service_id UUID NOT NULL REFERENCES public.attention_services(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE
);

-- Table: service_evidence (evidencia de servicios)
CREATE TABLE IF NOT EXISTS public.service_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_session_id UUID NOT NULL REFERENCES public.service_sessions(id) ON DELETE CASCADE,
  attention_id UUID NOT NULL REFERENCES public.attentions(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES public.stylists(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE
);

-- Table: attention_products (productos vendidos en una atención)
CREATE TABLE IF NOT EXISTS public.attention_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attention_id UUID NOT NULL REFERENCES public.attentions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE
);

-- Table: attention_service_products (productos vendidos por servicio específico)
CREATE TABLE IF NOT EXISTS public.attention_service_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attention_id UUID NOT NULL,
  attention_service_id UUID NOT NULL,
  product_id UUID NOT NULL,
  stylist_id UUID NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  commission_rate NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE
);

-- Table: purchases
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  purchase_date DATE NOT NULL,
  total_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pendiente',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: purchase_items
CREATE TABLE IF NOT EXISTS public.purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  unit_cost NUMERIC NOT NULL,
  total_cost NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: translations
CREATE TABLE IF NOT EXISTS public.translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, language_code, key)
);

-- Table: brands
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  identification_type text NOT NULL CHECK (identification_type IN ('NIT', 'CC', 'CE', 'Pasaporte')),
  identification_number text NOT NULL UNIQUE,
  name text NOT NULL,
  address text,
  phone text,
  email text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: schedule_templates
CREATE TABLE IF NOT EXISTS public.schedule_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: stylist_schedules
CREATE TABLE IF NOT EXISTS public.stylist_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  stylist_id uuid NOT NULL REFERENCES public.stylists(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean DEFAULT true,
  template_id uuid REFERENCES public.schedule_templates(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: stylist_time_off
CREATE TABLE IF NOT EXISTS public.stylist_time_off (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  stylist_id uuid NOT NULL REFERENCES public.stylists(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  start_time time,
  end_time time,
  type text NOT NULL CHECK (type IN ('vacation', 'sick', 'personal', 'training', 'other')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reason text,
  notes text,
  approved_by text,
  approved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: service_categories
CREATE TABLE IF NOT EXISTS public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: product_stylist_commissions
CREATE TABLE IF NOT EXISTS public.product_stylist_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  stylist_id uuid NOT NULL REFERENCES public.stylists(id) ON DELETE CASCADE,
  commission_rate numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: supplier_products
CREATE TABLE IF NOT EXISTS public.supplier_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  supplier_price numeric NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: service_stylist_commissions
CREATE TABLE IF NOT EXISTS public.service_stylist_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  stylist_id uuid NOT NULL REFERENCES public.stylists(id) ON DELETE CASCADE,
  commission_rate numeric NOT NULL DEFAULT 0,
  can_perform boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tablas antiguas (para referencia de migración)
-- Table: appointments
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  stylist_id UUID NOT NULL,
  service_id UUID NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME WITHOUT TIME ZONE NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  tenant_id UUID,
  branch_id UUID
);

-- Table: appointment_products
CREATE TABLE IF NOT EXISTS public.appointment_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL,
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  tenant_id UUID,
  branch_id UUID
);

-- Table: appointment_extra_services
CREATE TABLE IF NOT EXISTS public.appointment_extra_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL,
  service_name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  stylist_id UUID,
  tenant_id UUID,
  branch_id UUID
);

-- Table: appointment_sessions
CREATE TABLE IF NOT EXISTS public.appointment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  tenant_id UUID,
  branch_id UUID
);

-- Table: appointment_evidence
CREATE TABLE IF NOT EXISTS public.appointment_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID,
  attention_id UUID,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  extra_service_session_id UUID,
  tenant_id UUID,
  branch_id UUID
);

-- Table: extra_service_sessions
CREATE TABLE IF NOT EXISTS public.extra_service_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  extra_service_id UUID NOT NULL,
  appointment_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  tenant_id UUID,
  branch_id UUID
);

```

### 1.1.3 Configuraciones Regionales

Las siguientes tablas y campos gestionan la configuración regional del sistema:

```sql
-- Table: languages
CREATE TABLE IF NOT EXISTS public.languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  iso_code TEXT NOT NULL UNIQUE, -- e.g., 'en', 'es', 'fr'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: currencies
CREATE TABLE IF NOT EXISTS public.currencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE, -- Ej: USD, COP, EUR
  symbol text NOT NULL,
  format text, -- Ej: $#,##0.00;($#,##0.00)
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: countries
CREATE TABLE IF NOT EXISTS public.countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  iso_code text NOT NULL UNIQUE, -- Ej: CO, US, ES
  currency_id uuid REFERENCES public.currencies(id),
  timezone text, -- Zona horaria por defecto del país
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: tenant_subscriptions
CREATE TABLE IF NOT EXISTS public.tenant_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  subscription_plan_id uuid NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  start_date timestamp with time zone NOT NULL DEFAULT now(),
  end_date timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(tenant_id, subscription_plan_id, start_date)
);

-- Campos de configuración regional en tablas principales
-- Table: tenants
--   default_language_code TEXT REFERENCES public.languages(iso_code) ON UPDATE CASCADE ON DELETE SET NULL,
--   default_currency_id UUID REFERENCES public.currencies(id) ON UPDATE CASCADE ON DELETE SET NULL,
--   default_timezone TEXT,
-- Table: branches
--   language_code TEXT REFERENCES public.languages(iso_code) ON UPDATE CASCADE ON DELETE SET NULL,
--   currency_id UUID REFERENCES public.currencies(id) ON UPDATE CASCADE ON DELETE SET NULL,
--   timezone TEXT,
-- Table: users
--   language_code TEXT REFERENCES public.languages(iso_code) ON UPDATE CASCADE ON DELETE SET NULL,
--   currency_id UUID REFERENCES public.currencies(id) ON UPDATE CASCADE ON DELETE SET NULL,
--   timezone TEXT,
```

### 1.1.4 Índices y Constraints

Se han implementado índices en las columnas `tenant_id` y `branch_id` de todas las tablas de negocio para optimizar el rendimiento de las consultas multitenant. Se han establecido claves foráneas (`FOREIGN KEY`) para mantener la integridad referencial entre las tablas, y constraints de unicidad (`UNIQUE`) para asegurar la consistencia de los datos donde sea necesario.

**Estado:** Documentado.

## FASE 2: Desarrollo de Módulos por Rol

### 2.1 Módulo de Superadmin

#### 2.1.1 Gestión de Tenants

Se han establecido las bases para la gestión de tenants, incluyendo:

-   **CRUD de Tenants:** Se han creado las páginas de interfaz de usuario (`src/pages/Superadmin/CreateTenant.tsx`, `src/pages/Superadmin/TenantsList.tsx`, `src/pages/Superadmin/EditTenant.tsx`, `src/pages/Superadmin/TenantDetails.tsx`, `src/pages/Superadmin/CreateTenantAdmin.tsx`) y los hooks de datos (`src/hooks/useTenants.ts`) para la interacción con la base de datos. Actualmente, las interfaces de usuario de estas páginas son marcadores de posición y requieren implementación completa.
-   **Selector de Zonas Horarias Dinámico:** El hook `src/hooks/useTimezones.ts` permite la obtención de datos de zonas horarias, lo que sienta las bases para un selector dinámico en la creación/edición de tenants. La integración en la UI está pendiente.
-   **Asignación de Tenant Superadmin:** Existe una página (`src/pages/Superadmin/CreateTenantAdmin.tsx`) para la asignación de administradores de tenant, aunque su interfaz de usuario es un marcador de posición.

#### 2.1.2 Planes de Suscripción y Precios

Se han definido las estructuras para la gestión de planes de suscripción y precios:

-   **Gestión de Planes de Suscripción:** Se ha creado la página `src/pages/Superadmin/SubscriptionPlans.tsx` para la administración de planes.
-   **Precios por País:** Se ha creado la página `src/pages/Superadmin/CountryPrices.tsx` para la configuración de precios específicos por país.

#### 2.1.3 Configuración Global del Sistema

Se han establecido los componentes para la configuración global del sistema:

-   **Parámetros Globales:** La página `src/pages/Superadmin/GlobalSettings.tsx` está disponible para la configuración de parámetros globales.
-   **Gestión de Idiomas:** La página `src/components/TranslationAdmin.tsx` proporciona una interfaz para la gestión de traducciones del sistema.

#### 2.1.4 Monitoreo del Sistema

Se han implementado las páginas y hooks para el monitoreo del sistema:

-   **Dashboard de Superadmin:** La página `src/pages/Superadmin/SuperadminStats.tsx` sirve como el dashboard principal para métricas generales.
-   **Reportes de Actividad:** Se han creado páginas para `src/pages/Superadmin/SystemAlerts.tsx`, `src/pages/Superadmin/ErrorReports.tsx`, y `src/pages/Superadmin/PerformanceMetrics.tsx`. El hook `src/hooks/useTenantAccessLogs.ts` permite la obtención de logs de acceso.

#### 2.1.5 Navegación del Panel de Superadmin

Se ha corregido un problema crítico de navegación:

-   **Corrección de Navegación:** Se ha resuelto el problema donde todos los enlaces del menú de superadministrador redirigían a la misma ruta. La lógica en `src/components/ProtectedRoute.tsx` y `src/pages/Superadmin/SuperadminLayout.tsx` ha sido ajustada para permitir una navegación correcta y fluida entre las diferentes secciones del panel de superadministrador.

**Estado de la Fase 2.1:** En desarrollo. Las bases de datos y los hooks de datos están en su lugar para la mayoría de las funcionalidades, pero muchas interfaces de usuario aún requieren implementación completa.
---
### Módulo: Gestión de Tenants (Superadmin)

**Fecha de Finalización:** 13 de julio de 2025

**Descripción General:**
Este módulo proporciona al Superadministrador una funcionalidad completa para la Creación, Lectura, Actualización y Eliminación (CRUD) de tenants en el sistema. Se ha puesto especial énfasis en la robustez de los datos y en un flujo de trabajo eficiente.

**Funcionalidades Clave:**
1.  **CRUD Completo:**
    -   **Crear:** Un formulario único permite crear un nuevo tenant y su usuario administrador principal en una sola operación atómica.
    -   **Leer:** Listado de todos los tenants con su información clave.
    -   **Actualizar:** Formulario de edición completo para modificar todos los datos del tenant.
    -   **Eliminar:** Borrado en cascada de un tenant y todos sus datos asociados, disponible solo en entorno de desarrollo para seguridad.

2.  **Recopilación de Datos Detallada:**
    -   Se ha implementado una estructura de datos exhaustiva para cada tenant, incluyendo información de contacto, fiscal y de dirección física.

3.  **Integración con Google Maps API:**
    -   Los formularios de creación y edición utilizan la **Places API** de Google para el autocompletado de direcciones, mejorando la UX y la precisión de los datos.
    -   La búsqueda de direcciones se restringe dinámicamente al país seleccionado por el usuario.
    -   Se utiliza la **Maps JavaScript API** para mostrar la ubicación del tenant en un mapa interactivo.
    -   La latitud y longitud se almacenan en la base de datos para futuras funcionalidades.

**Componentes Técnicos:**

-   **Base de Datos:**
    -   Se modificó la tabla `tenants` para incluir campos estructurados como `legal_name`, `tax_id`, `contact_phone`, `whatsapp_phone`, `commercial_email`, `einvoicing_email`, `physical_address_line1`, `physical_city`, `latitude`, `longitude`, etc.
    -   **RPC `create_tenant_with_admin`:** Función PostgreSQL transaccional que asegura la creación atómica del tenant y su administrador.
    -   **RPC `delete_tenant_cascade`:** Función que elimina de forma segura un tenant y todos sus datos dependientes.

-   **Frontend:**
    -   **Hooks:** `useTenants`, `useTenantById`, `useUpdateTenant`, `useDeleteTenant`.
    -   **Páginas:** `CreateTenant.tsx`, `EditTenant.tsx`, `TenantsList.tsx`.
    -   **Componentes Reutilizables:**
        -   `AddressAutocompleteInput.tsx`: Gestiona la interacción con la Places API de Google.
        -   `MapDisplay.tsx`: Muestra la ubicación en un mapa.

-   **Variables de Entorno:**
    -   La funcionalidad de Google Maps depende de la clave `VITE_GOOGLE_MAPS_API_KEY` definida en el archivo `.env.local`.

**Estado:** Completado y verificado.

---
### Módulo: Planes, Precios y Monitoreo (Superadmin)

**Fecha de Finalización:** 13 de julio de 2025

**Descripción General:**
Este conjunto de módulos permite al Superadministrador gestionar la oferta comercial de la plataforma y monitorear su estado financiero y de rendimiento.

**Funcionalidades Clave:**

1.  **Gestión de Planes de Suscripción:**
    -   CRUD completo para los planes de suscripción (ej. Mensual, Anual).
    -   Posibilidad de definir un orden de visualización para los planes.

2.  **Sistema de Precios Versionado y Automatizado:**
    -   **Precios Base en COP:** El Superadministrador solo necesita gestionar los precios base y por sucursal extra en una única moneda (COP).
    -   **Cálculo Automático:** Los precios para otros países se calculan automáticamente usando una tasa de cambio.
    -   **Regla de Redondeo:** Se aplica una regla de redondeo comercial a `.99` para los precios calculados.
    -   **Historial de Precios:** Se guarda un historial de todos los cambios de precios, permitiendo programar aumentos a futuro.
    -   **Caché de Tasas de Cambio:** Una Edge Function (`update-exchange-rates`) actualiza diariamente una tabla local con las tasas de cambio, asegurando un alto rendimiento y bajo costo de API.

3.  **Dashboard Financiero:**
    -   Muestra métricas clave de negocio como MRR, ARR, proyecciones de ingresos y desglose de planes activos.
    -   Utiliza una función RPC (`get_superadmin_financial_stats`) para agregar los datos de forma eficiente.

4.  **Diseño Totalmente Responsive:**
    -   Todas las interfaces, desde los formularios hasta las tablas y el dashboard, están diseñadas para funcionar de manera óptima en dispositivos móviles, tablets y escritorio.
    -   Se utiliza un hook `useScreenSize` para renderizar componentes específicos por tamaño de pantalla (ej. tarjetas en móvil, tablas en escritorio).

**Componentes Técnicos:**

-   **Base de Datos:**
    -   **Tabla `plan_price_history`:** Almacena los precios de forma versionada con una fecha de vigencia.
    -   **Tabla `exchange_rates`:** Funciona como caché para las tasas de cambio.
    -   **RPC `get_calculated_plan_prices`:** Calcula los precios para todas las monedas en tiempo real.
    -   **RPC `get_superadmin_financial_stats`:** Agrega y calcula las métricas para el dashboard.
-   **Edge Function `update-exchange-rates`:** Tarea programada (Cron Job) que actualiza las tasas de cambio.
-   **Frontend:**
    -   **Hooks:** `useSubscriptionPlans`, `usePlanPriceHistory`, `useCalculatedPrices`, `useFinancialStats`, `useScreenSize`.
    -   **Páginas:** `SubscriptionPlans.tsx`, `PlanPricingManager.tsx`, `SuperadminStats.tsx`.
    -   **Componentes:** `DatePickerWrapper.tsx` (nuevo selector de fecha), componentes de visualización de precios y gráficos.

**Estado:** Completado y verificado.
---
### Módulo: Configuración Global del Sistema (Superadmin)

**Fecha de Finalización:** 13 de julio de 2025

**Descripción General:**
Este módulo centraliza la gestión de todas las configuraciones regionales y de localización del sistema, proporcionando al Superadministrador un control total sobre cómo se presentan los datos en diferentes regiones.

**Funcionalidades Clave:**

1.  **Gestión de Localizaciones (Idiomas):**
    -   Permite crear y editar "localizaciones", que son combinaciones de idioma y región (ej. "Español (Colombia)", "Inglés (USA)").
    -   Utiliza códigos de localización completos (ej. `es-CO`) para una correcta integración con librerías de internacionalización (i18n).

2.  **Gestión de Monedas:**
    -   CRUD completo para las monedas del sistema.
    -   Permite definir no solo el nombre, código y símbolo, sino también el **formato de visualización**: posición del símbolo, separadores de miles y decimales, y número de decimales.

3.  **Gestión de Países:**
    -   CRUD completo para los países.
    -   Permite **asociar** a cada país una **moneda por defecto**, una **localización por defecto** y una **zona horaria por defecto** de las listas previamente configuradas.
    -   Incluye la gestión de **prefijos telefónicos**, asociando un prefijo a cada país desde una tabla maestra.

4.  **Integración en Formularios (Mejora de UX):**
    -   **Selectores con Búsqueda (`Combobox`):** Todos los selectores en los diálogos de configuración y en los formularios de creación/edición de tenants han sido reemplazados por componentes con búsqueda, facilitando la selección en listas largas.
    -   **Input de Teléfono Inteligente (`PhoneInput`):** Se ha implementado un componente de teléfono que:
        -   Muestra la **bandera del país** y el prefijo en un selector.
        -   Permite buscar el prefijo por nombre de país.
        -   Detecta automáticamente el prefijo si el usuario lo escribe o pega en el campo de texto.
        -   Se inicializa con el prefijo del país seleccionado para el tenant.

**Componentes Técnicos:**

-   **Base de Datos:**
    -   **Tabla `languages`**: Funciona como la tabla de "Localizaciones".
    -   **Tabla `currencies`**: Enriquecida con campos de formato.
    -   **Tabla `countries`**: Relacionada con `languages`, `currencies` y `phone_prefixes`.
    -   **Tabla `phone_prefixes`**: Nueva tabla maestra con una lista global de prefijos telefónicos.
-   **Frontend:**
    -   **Hooks:** `useLocalizations`, `useCurrencies`, `useCountries`, `usePhonePrefixes`.
    -   **Páginas:** `LocalizationsSettings.tsx`, `CurrenciesSettings.tsx`, `CountriesSettings.tsx`.
    -   **Componentes Reutilizables:**
        -   `Combobox.tsx`: Nuevo componente de selector con búsqueda.
        -   `PhoneInput.tsx`: Nuevo componente de input telefónico con prefijo y bandera.

**Estado:** Completado y verificado.
### Módulo: Corrección del Formato de Moneda

**Fecha de Finalización:** 14 de julio de 2025

**Descripción General:**
Se ha corregido un error crítico en el módulo de gestión de monedas donde el campo `format` no se guardaba en la base de datos. Además, se ha mejorado la interfaz para que la previsualización del formato sea dinámica y coherente con la configuración.

**Funcionalidades Clave:**

1.  **Cálculo Automático del Formato:**
    -   Al crear o editar una moneda, el campo `format` se genera automáticamente en el frontend a partir de los parámetros de la moneda (símbolo, posición, separadores, decimales).
    -   Esto elimina la necesidad de que el usuario ingrese manualmente una cadena de formato compleja y asegura la consistencia de los datos.

2.  **Previsualización Dinámica:**
    -   La columna "Formato de Ejemplo" en la lista de monedas ahora utiliza los parámetros de cada moneda para renderizar una previsualización precisa y en tiempo real.
    -   Se ha implementado una función de utilidad (`formatCurrencyExample`) dentro del componente `CurrenciesSettings.tsx` para este propósito.

**Componentes Técnicos:**

-   **Frontend:**
    -   **`CurrencyDialog.tsx`:** Se ha modificado la función `onSubmit` para calcular y añadir el campo `format` al objeto de datos antes de enviarlo a la base de datos.
    -   **`CurrenciesSettings.tsx`:** Se ha añadido la función `formatCurrencyExample` y se ha actualizado el JSX para usarla en la renderización de la tabla y las tarjetas, asegurando que la previsualización sea dinámica.

**Estado:** Completado y verificado.