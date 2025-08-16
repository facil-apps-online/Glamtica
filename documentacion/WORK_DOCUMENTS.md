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
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
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
---
### Refactorización del Componente `ProfileSettings`

**Fecha:** 2025-07-15

#### Descripción del Cambio

Se ha refactorizado el componente `c:/Desarrollos/Glamtica.app/src/pages/Superadmin/ProfileSettings.tsx` para optimizar y limpiar la lógica de renderizado de las pestañas del perfil de superadministrador.

#### Detalles Técnicos

-   **Antes:** El componente utilizaba un estado local (`activeTab`) junto con renderizado condicional de JavaScript (`&&`) para mostrar el contenido de la pestaña activa. Este enfoque era redundante, ya que el componente `Tabs` de `shadcn/ui` gestiona esta lógica de forma interna.
-   **Después:** Se eliminó el renderizado condicional explícito. Ahora, los componentes `TabsContent` se declaran directamente como hijos de `Tabs`. El componente `Tabs` se encarga de mostrar el `TabsContent` cuyo `value` coincide con el de la `TabsTrigger` seleccionada.

#### Beneficios

-   **Código más Limpio:** Se reduce la verbosidad y se elimina lógica innecesaria.
-   **Mejores Prácticas:** Se alinea el uso del componente con la documentación y las prácticas recomendadas para `shadcn/ui`.
-   **Mantenibilidad:** El código es más fácil de leer y mantener.
---
### Módulo: Cambio de Contraseña Seguro

**Fecha de Finalización:** 16 de julio de 2025

**Descripción General:**
Se ha rediseñado por completo el flujo de cambio de contraseña para el perfil de usuario, abordando problemas de seguridad y mejorando la experiencia de usuario. Este nuevo sistema se alinea con la arquitectura de autenticación personalizada de la aplicación.

**Funcionalidades Clave:**

1.  **Verificación de Contraseña Actual:**
    -   El sistema ahora requiere que el usuario ingrese su contraseña actual como medida de seguridad antes de permitir el cambio.

2.  **Hashing Consistente:**
    -   La nueva función de base de datos utiliza exactamente el mismo algoritmo de hashing (`pgcrypto.crypt`) que la función de `login`, garantizando la compatibilidad y seguridad.

3.  **Cierre de Sesión Forzado:**
    -   Tras un cambio de contraseña exitoso, la sesión del usuario se cierra automáticamente en todos los dispositivos. Se muestra un mensaje informativo y se le redirige a la página de inicio de sesión, obligándolo a autenticarse con sus nuevas credenciales.

**Componentes Técnicos:**

-   **Base de Datos:**
    -   **RPC `change_password`:** Se ha creado una nueva función PostgreSQL que:
        1.  Recibe el ID del usuario, la contraseña actual y la nueva contraseña.
        2.  Verifica que la contraseña actual sea correcta comparándola con el hash almacenado en `public.users`.
        3.  Si es correcta, genera un nuevo hash para la nueva contraseña y actualiza el registro del usuario.
        4.  Devuelve un estado de éxito o fracaso con un mensaje claro.
    -   **Migración Versionada:** La creación de esta función está registrada en el archivo de migración `supabase/migrations/20250716120000_create_change_password_function.sql`.

-   **Frontend:**
    -   **Hook `useUpdatePassword`:** Se ha refactorizado completamente para:
        1.  Llamar a la nueva función RPC `change_password`.
        2.  En caso de éxito (`onSuccess`), invocar la función `logout()` del `AuthContext` para invalidar la sesión actual.
    -   **Componente `SecurityTab.tsx`:** Se ha ajustado para manejar la nueva lógica, pasando la contraseña actual a la mutación y mostrando un mensaje de éxito claro al usuario antes del cierre de sesión.

**Estado:** Completado y verificado.
---
### Módulo: Estabilización de Integraciones de Google

**Fecha de Finalización:** 16 de julio de 2025

**Descripción General:**
Se ha solucionado una inestabilidad crítica en el flujo de autenticación de Google (Drive y Gmail) que provocaba la sobreescritura de credenciales. La solución permite ahora gestionar ambas integraciones de forma independiente y robusta, incluso si utilizan diferentes cuentas de Google.

**Funcionalidades Clave:**

1.  **Flujo de Autenticación Preciso:**
    -   Se utiliza el parámetro `state` de OAuth2 para pasar el contexto (`tenant_id` y `provider`) a través de todo el flujo de autorización.
    -   Esto elimina la ambigüedad en la página de callback y asegura que cada servicio se gestione de forma independiente.

2.  **Configuración Centralizada:**
    -   Las credenciales de la API de Google (`client_id`, `redirect_uri`) se gestionan ahora desde una tabla `public.integrations_config` en la base de datos, en lugar de estar en `vault` o codificadas.

**Componentes Técnicos:**

-   **Base de Datos:**
    -   **RPCs `get_google_auth_url` y `get_gmail_auth_url`**: Modificadas para construir un `state` enriquecido (`tenant_id:provider`) y leer la configuración desde `public.integrations_config`.
    -   **Función `url_encode`**: Creada para codificar de forma segura los parámetros de la URL.
    -   **Tabla `public.integrations_config`**: Nueva tabla para almacenar la configuración de la API.
    -   Se desactivó **RLS** en `public.integrations_config` para permitir el acceso desde las funciones RPC.

-   **Edge Function `google-oauth-token`**:
    -   Modificada para recibir el `provider` desde el frontend y usarlo para una escritura precisa (`upsert`) en la tabla `tenant_integrations`.

-   **Frontend:**
    -   **`Callback.tsx`**: Actualizado para interpretar el `state` enriquecido y pasar el `provider` a la Edge Function.
    -   **`TenantIntegrationManager.tsx`**: Corregido un bug en `handleConnect` para procesar correctamente la respuesta (un array) de las funciones RPC de la base de datos.

**Estado:** Completado y verificado.

---

# Arquitectura de Envío de Correos Transaccionales

## Resumen Técnico

El sistema utiliza una arquitectura de cola de trabajos asíncrona para garantizar un envío de correos fiable y escalable, sin bloquear la interfaz de usuario.

### Componentes Clave

1.  **Tabla `email_queue` (Cola de Trabajos):**
    *   Actúa como el buffer central. Cualquier parte del sistema que necesite enviar un correo (registro de usuario, recordatorios, etc.) no lo envía directamente, sino que inserta una "orden de trabajo" en esta tabla.
    *   Almacena el `recipient_user_id`, el `template_type` y los datos dinámicos (`template_data`).
    *   Registra el estado del trabajo (`PENDING`, `PROCESSING`, `SENT`, `FAILED`), los intentos y los mensajes de error.

2.  **RPC `enqueue_..._email()` (Punto de Entrada):**
    *   Funciones de base de datos muy simples y rápidas cuyo único propósito es insertar un nuevo trabajo en la tabla `email_queue`.
    *   Devuelven una respuesta inmediata al cliente, confirmando que el trabajo ha sido encolado.

3.  **Edge Function `process-email-queue` (El Trabajador):**
    *   Es el cerebro del sistema y se ejecuta en segundo plano.
    *   Se invoca cuando hay un nuevo trabajo.
    *   **Orquesta todo el proceso de forma síncrona:**
        a. Marca el trabajo como `PROCESSING`.
        b. Obtiene todos los datos necesarios de la base de datos (usuario, plantilla, integración de Gmail).
        c. **Maneja el refresco de tokens:** Llama a la RPC `decrypt_secret` para obtener el `refresh_token` limpio, lo usa para solicitar un nuevo `access_token` a Google y actualiza la base de datos.
        d. Procesa la plantilla HTML con los datos dinámicos.
        e. Envía el correo a través de la API de Gmail.
        f. Actualiza el estado final del trabajo en la tabla `email_queue` a `SENT` o `FAILED`.
---
### Módulo: Gestión de Plataformas (CRUD)

**Fecha:** 26 de julio de 2025

**Objetivo:**
Implementar un módulo completo y seguro para que el `super_admin` pueda gestionar las diferentes plataformas (aplicaciones) del ecosistema.

**Arquitectura y Decisiones Clave:**

1.  **Lógica Centralizada en Edge Function:** En lugar de realizar consultas directas a la base de datos desde el frontend, se optó por centralizar toda la lógica de negocio en una nueva Edge Function dedicada. Esto mejora la seguridad, el control y la capacidad de monitorización.

2.  **Función Dedicada `superadmin-actions`:** Se creó una nueva Edge Function (`supabase/functions/superadmin-actions`) exclusivamente para las operaciones del portal de superadministración. Esto separa las preocupaciones, manteniendo el código más limpio y organizado en comparación con añadir esta lógica a la ya existente `user-actions`.

3.  **Instrumentación de Métricas:** Siguiendo el patrón de monitorización del proyecto, cada acción dentro de la Edge Function (`get_platforms`, `create_platform`, etc.) mide su tiempo de ejecución y registra el resultado en la tabla `api_request_metrics`. Esto se hace dentro de un bloque `try...finally` para garantizar que la métrica se registre incluso si la operación falla.

**Componentes Creados y Modificados:**

*   **Backend (Edge Function):**
    *   `supabase/functions/superadmin-actions/index.ts`: (Nuevo) Contiene toda la lógica para el CRUD de plataformas, incluyendo la validación de datos y la inserción de métricas.

*   **Frontend (Páginas y Componentes):**
    *   `src/pages/Superadmin/Platforms/`: (Nuevo Directorio)
    *   `src/pages/Superadmin/Platforms/PlatformsList.tsx`: (Nuevo) Muestra la lista de plataformas, maneja la carga de datos y las acciones de editar/eliminar.
    *   `src/pages/Superadmin/Platforms/PlatformForm.tsx`: (Nuevo) Componente reutilizable con `react-hook-form` y `zod` para la validación y gestión del formulario de creación/edición.
    *   `src/pages/Superadmin/Platforms/CreatePlatform.tsx`: (Nuevo) Página que utiliza `PlatformForm` para crear nuevas plataformas.
    *   `src/pages/Superadmin/Platforms/EditPlatform.tsx`: (Nuevo) Página que obtiene los datos de una plataforma por su ID y utiliza `PlatformForm` para la edición.

*   **Configuración y Rutas:**
    *   `src/config/superadminNavigation.ts`: (Modificado) Se añadió un nuevo grupo "Administración" con el enlace a "Plataformas".
    *   `src/App.tsx`: (Modificado) Se añadieron las rutas para las nuevas páginas del CRUD de plataformas y se importaron los componentes necesarios.

**Troubleshooting (Problemas Resueltos):**

1.  **Error de Referencia (`ReferenceError`):** Durante el desarrollo, la aplicación falló porque los nuevos componentes de las páginas de plataformas (`PlatformsList`, etc.) no estaban importados en `App.tsx` donde se definían sus rutas. Se solucionó añadiendo las sentencias `import` correspondientes.

2.  **Error de CORS:** Tras solucionar el primer error, la página de plataformas no podía cargar datos debido a un error de CORS. Se diagnosticó correctamente que la causa raíz no era la configuración de CORS, sino que la nueva Edge Function `superadmin-actions` no había sido desplegada en el entorno de Supabase. El despliegue de la función resolvió el problema.

**Estado:** Completado y verificado.
---
### Módulo: Funciones de Matriz de Comisiones (Productos y Servicios)

**Fecha de Finalización:** 11 de agosto de 2025

**Descripción General:**
Se han corregido y mejorado las funciones RPC `get_product_commission_matrix` y `get_service_commission_matrix` para asegurar la correcta obtención de las comisiones de productos y servicios por usuario y sucursal. Las correcciones abordan problemas de referencia a tablas y columnas inexistentes, y adaptan la lógica para obtener las asignaciones de sucursal directamente de la metadata de los usuarios de Supabase Auth.

**Problemas Resueltos:**
1.  **`column "master_product_id" does not exist` / `column "master_service_id" does not exist`:** Se corrigió el uso de nombres de columna incorrectos en las tablas `public.branch_products` y `public.branch_services`. Las funciones ahora utilizan `product_id` y `service_id` respectivamente.
2.  **`relation "public.users" does not exist`:** Se actualizó la referencia a la tabla de usuarios de `public.users` a `auth.users`, que es la tabla de usuarios gestionada por Supabase Auth.
3.  **`relation "public.user_assignments" does not exist`:** Se eliminó la dependencia de la tabla `public.user_assignments`. Las asignaciones de sucursal de los usuarios ahora se extraen directamente del campo `raw_user_meta_data->'assignments'` en la tabla `auth.users`.

**Componentes Técnicos Modificados:**

-   **Funciones RPC de PostgreSQL:**
    -   `get_product_commission_matrix`: Actualizada para usar `auth.users` y extraer `branch_id` de `raw_user_meta_data->'assignments'`, y corregir la referencia a `product_id`.
    -   `get_service_commission_matrix`: Actualizada para usar `auth.users` y extraer `branch_id` de `raw_user_meta_data->'assignments'`, y corregir la referencia a `service_id`.

**Estado:** Completado y verificado (a través de la creación de una nueva migración).
---
### Módulo: Corrección y Mejora del Módulo de Atenciones

**Fecha de Finalización:** 15 de agosto de 2025

**Descripción General:**
Se ha realizado una revisión y corrección exhaustiva del módulo de atenciones para solucionar varios bugs, mejorar la experiencia de usuario y la estabilidad general. Se ha identificado y documentado una oportunidad de mejora de performance en el backend.

**Correcciones y Mejoras Clave:**

1.  **Filtro de Atenciones por Usuario:**
    -   **Problema:** El filtro de atenciones por usuario no funcionaba correctamente debido a una consulta ineficiente en una tabla anidada.
    -   **Solución:** Se ha modificado el hook `useAttentions.ts` para utilizar un `INNER JOIN` explícito (`!inner`) en la consulta de Supabase. Esto asegura que solo se devuelvan las atenciones que corresponden al usuario seleccionado, solucionando el bug de filtrado.

2.  **Actualización de la Vista de Calendario:**
    -   **Problema:** Al añadir un nuevo servicio a una atención existente, la vista de calendario no se actualizaba para reflejar el cambio.
    -   **Solución:** Se ha modificado el hook `useAttentionServices.ts` para que, tras añadir un servicio, invalide no solo la query de `attentions`, sino también la de `attention-dates`, forzando la actualización del calendario.

3.  **Estabilidad del Formulario de Atenciones (`AttentionDialog.tsx`):**
    -   **Reset de Usuario:** Se ha añadido lógica para que el usuario seleccionado se resetee automáticamente al cambiar el servicio, evitando asignaciones incorrectas.
    -   **Keys Estables en React:** Se ha reemplazado el uso de `index` como `key` por un ID único para cada servicio en el formulario, mejorando la performance y evitando bugs de estado en la renderización de la lista de servicios.
    -   **Feedback de Carga:** Se ha añadido un indicador de "Cargando..." en el selector de usuarios para mejorar la UX mientras se espera la respuesta del servidor.

4.  **Identificación de Deuda Técnica (Performance):**
    -   Se ha identificado que el hook `useAvailableUsers.ts` realiza una llamada a la base de datos por cada usuario para verificar su disponibilidad, lo que causa lentitud. Se ha documentado en `SOLUTION_LOG.md` la necesidad de refactorizar esta lógica en una única función de base de datos en el backend para optimizar el rendimiento.

**Componentes Técnicos Modificados:**

-   **Hooks:** `useAttentions.ts`, `useAttentionServices.ts`.
-   **Componentes:** `AttentionDialog.tsx`.

**Estado:** Completado y verificado. La funcionalidad del módulo de atenciones es ahora más estable y robusta. La mejora de performance queda como deuda técnica documentada.
---
### Módulo: Centralización de Llamadas a Base de Datos en `tenant-actions`

**Fecha de Finalización:** 15 de agosto de 2025

**Descripción General:**
Se ha refactorizado el módulo de atenciones para centralizar todas las llamadas directas a la base de datos a través de la Edge Function `tenant-actions`. Esta estandarización mejora la seguridad, el mantenimiento y la consistencia del código.

**Funcionalidades Clave:**

1.  **Creación de Nuevos `case` en `tenant-actions`:**
    -   Se han añadido nuevos `case` a la Edge Function para manejar todas las operaciones de base de datos del módulo de atenciones, incluyendo la obtención de atenciones, la creación y cancelación de las mismas, la adición de servicios y la obtención de usuarios disponibles.

2.  **Refactorización de Hooks:**
    -   Se han modificado los hooks `useAttentions`, `useAttentionServices` y `useAvailableUsers` para que utilicen la función `callTenantAction` en lugar de realizar llamadas directas a Supabase (`supabase.from(...)` o `supabase.rpc(...)`).

**Componentes Técnicos Modificados:**

-   **Edge Function:** `supabase/functions/tenant-actions/index.ts`
-   **Hooks:** `useAttentions.ts`, `useAttentionServices.ts`, `useAvailableUsers.ts`

**Estado:** Completado y verificado.