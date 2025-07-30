# Arquitectura y Documentación de Glamtica

## 1. Filosofía de Diseño

El sistema está diseñado como un "Universo" multiaplicación. No existe un único superadministrador global predefinido, sino un modelo de propiedad explícito que permite una mayor flexibilidad y control.

- **Plataformas (Aplicaciones):** El universo contiene una o más plataformas (ej: "Glamtica", "App B"). Cada plataforma es una aplicación de software independiente.
- **Tenants Propietarios:** Cada plataforma tiene un "Tenant Propietario" asociado. Este tenant representa a la entidad que posee y gestiona la aplicación.
- **Tenants Regulares:** Son los clientes finales que se suscriben y utilizan una plataforma.

## 2. El Rol `super_admin`

El `super_admin` es el rol de más alto nivel. Su poder no proviene de un estado especial en la base de datos, sino de la combinación de dos mecanismos:

1.  **Acumulación de Asignaciones:** Un usuario con el rol `super_admin` tiene la capacidad de acumular asignaciones de **todos los tenants propietarios** de todas las plataformas. Estas asignaciones se almacenan en un arreglo (array) dentro de su `app_metadata`.
2.  **Política de Acceso Universal (RLS):** Las políticas de seguridad a nivel de fila (RLS) deben incluir una cláusula `OR` que otorgue acceso total si el rol activo del usuario es `'super_admin'`. Esto le permite operar a través de todo el sistema, sin las restricciones de un tenant específico.

    ```sql
    -- Ejemplo de Política RLS para la tabla 'tenants'
    CREATE POLICY "Enable read access for all users" ON public.tenants
    FOR SELECT USING (
      -- 1. El super_admin puede ver todos los tenants.
      (SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
      OR
      -- 2. Un usuario normal solo puede ver su propio tenant.
      (id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid)
    );
    ```

## 3. Flujo de Expansión del Universo

El sistema está diseñado para crecer siguiendo un flujo de trabajo definido:

1.  **Setup Inicial:** El formulario `/setup-superadmin` se utiliza una única vez para crear la **primera plataforma**, su **tenant propietario** asociado, y el **usuario `super_admin`**, otorgándole a este último su primera y fundamental asignación.
2.  **Creación de Nuevas Aplicaciones:** En el futuro, el `super_admin`, desde un panel de administración, podrá crear una nueva `platform`.
3.  **Creación de Tenants Propietarios:** Al crear la nueva plataforma, se generará también su `tenant` propietario correspondiente.
4.  **Asignación de Acceso:** Finalmente, el `super_admin` se asignará a sí mismo el acceso a este nuevo tenant propietario, añadiendo una nueva entrada a su arreglo `app_metadata.assignments`, expandiendo así su dominio.

## 4. Arquitectura de Autenticación y Acciones de Usuario

Para mantener la seguridad y la flexibilidad, las acciones críticas de usuario (creación, recuperación de contraseña) se gestionan a través de un sistema híbrido que combina la API de administración de Supabase con la lógica de negocio personalizada, orquestada a través de una Edge Function genérica.

### 4.1. Edge Function Genérica: `user-actions`

Esta función es el punto de entrada centralizado para todas las operaciones de usuario que requieren privilegios de administrador. Utiliza un patrón de "acción" y "payload" para enrutar las peticiones.

-   **Ubicación:** `supabase/functions/user-actions/index.ts`
-   **Entradas:**
    -   `action`: Un string que define la operación (ej: `'generate-recovery-token'`).
    -   `payload`: Un objeto JSON con los datos necesarios para la acción.
-   **Seguridad:** La función se ejecuta con la `SUPABASE_SERVICE_ROLE_KEY`, otorgándole acceso a la API de administración de `supabase.auth.admin`.

### 4.2. Flujo de Recuperación de Contraseña Personalizado (Control Total)

**Justificación Estratégica:** El siguiente flujo personalizado es una decisión de diseño fundamental para soportar la arquitectura **multi-plataforma** del sistema (Glamtica, App B, etc.). Los métodos estándar de Supabase para la recuperación de contraseña no son viables, ya que están ligados a una única configuración de redirección y plantillas de correo. Para permitir que cada plataforma utilice su propio dominio en los enlaces de recuperación y sus propias plantillas de correo electrónico, se optó por un enfoque desacoplado: el backend se encarga únicamente de la lógica segura (generar, validar e invalidar un token), mientras que el frontend de cada plataforma es responsable de la presentación (construir la URL y gestionar el envío del correo). Este diseño garantiza la flexibilidad y escalabilidad necesarias para el universo de aplicaciones.

A continuación se detalla el flujo, orquestado a través de la Edge Function `user-actions`.

#### Parte 1: Generación del Token (`generate-recovery-token`)

1.  **Petición del Cliente:** El frontend (ej: `AuthPage.tsx`) invoca la Edge Function `user-actions` con la acción `'generate-recovery-token'` y un `payload` que contiene el `email` del usuario.
2.  **Búsqueda del Usuario:** La Edge Function utiliza `supabase.auth.admin.listUsers({ email })` para encontrar al usuario de forma segura en el sistema.
3.  **Creación y Almacenamiento del Token:** Se genera un token único universal (UUID) mediante `crypto.randomUUID()`. Luego, se utiliza `supabase.auth.admin.updateUserById()` para guardar este `token` y una marca de tiempo (`recovery_sent_at`) en el campo `user_metadata` del objeto de usuario en Supabase Auth.
4.  **Respuesta al Cliente:** La Edge Function devuelve el `token` recién generado al frontend.
5.  **Construcción del Enlace:** El frontend es responsable de recibir el token y construir la URL de recuperación completa (ej: `https://[platform-domain]/update-password?token=[token]`). La plataforma tiene el control de cómo y cuándo presentar o enviar este enlace al usuario.

#### Parte 2: Cambio de Contraseña con Token (`set-password-with-token`)

1.  **Petición del Cliente:** El usuario accede a la página `/update-password` con el token en la URL. El frontend envía una nueva petición a `user-actions` con la acción `'set-password-with-token'` y un `payload` que contiene el `token` y la `newPassword`.
2.  **Validación del Token (RPC):** La Edge Function invoca una función de base de datos (`RPC`) llamada `get_user_by_recovery_token`, pasándole el token. Esta RPC es responsable de buscar un usuario que tenga ese token en su `user_metadata` y verificar que no haya expirado (la lógica de expiración, típicamente de 1 hora, está definida dentro de la propia RPC).
3.  **Actualización de Contraseña:** Si la RPC devuelve un usuario válido, la Edge Function utiliza el `id` de ese usuario para llamar a `supabase.auth.admin.updateUserById()` y establecer la nueva contraseña (`password`).
4.  **Invalidación del Token:** Inmediatamente después de cambiar la contraseña, la función realiza una **segunda llamada** a `updateUserById()` para eliminar los campos `recovery_token` y `recovery_sent_at` de `user_metadata`. Este paso es crucial para asegurar que el token no pueda ser reutilizado.

### 4.3. Arquitectura de Acciones del Superadministrador

Para mantener una separación de responsabilidades clara y un código organizado, las operaciones administrativas que no están directamente relacionadas con la autenticación de un usuario (como la gestión de plataformas, tenants, planes, etc.) se encapsulan en su propia Edge Function dedicada.

-   **Edge Function Dedicada:** `superadmin-actions`
-   **Ubicación:** `supabase/functions/superadmin-actions/index.ts`
-   **Propósito:** Sirve como el API backend para todas las operaciones del panel de superadministración. Centraliza la lógica de negocio, la validación y la seguridad.
-   **Monitorización:** Cada acción dentro de esta función está instrumentada para registrar su tiempo de ejecución y estado en la tabla `api_request_metrics`, proporcionando una visibilidad completa del rendimiento del sistema.
-   **Ejemplo de Acción:** El CRUD completo para la gestión de `platforms` se implementa aquí, con acciones como `get_platforms`, `create_platform`, `update_platform` y `delete_platform`.

#### 4.3.1. Gestión Centralizada de Tenants (CRUD)

Siguiendo el principio de centralización, todo el ciclo de vida de un `tenant` (Crear, Leer, Actualizar, Borrar) es gestionado a través de la Edge Function `superadmin-actions`. Este enfoque garantiza la consistencia, seguridad y el cumplimiento de las reglas de negocio, como la asignación obligatoria a una `platform`.

**Flujo de Datos:**

1.  **Frontend (`useTenants.ts`):** El hook de React Query, en lugar de interactuar directamente con la base de datos, invoca la Edge Function `superadmin-actions` con la acción correspondiente (ej: `'get_tenants'`, `'update_tenant'`).
2.  **Edge Function (`superadmin-actions`):** Actúa como un controlador central. Recibe la acción y el `payload`, y orquesta la lógica de backend.
3.  **Backend (RPC y Lógica de Negocio):**
    *   Para operaciones de **lectura** (`get_tenants`), la Edge Function llama a una función RPC dedicada en la base de datos (`get_tenants`). Esta RPC está optimizada para realizar las uniones (`JOIN`) necesarias, como adjuntar la información de la `platform` a la que pertenece cada `tenant`.
    *   Para operaciones de **escritura** (`create_tenant`, `delete_tenant`), la Edge Function invoca las RPCs correspondientes (`create_tenant_with_admin`, `delete_tenant_cascade`) que contienen toda la lógica transaccional para asegurar la integridad de los datos (crear el usuario admin, la sucursal por defecto, etc.).
    *   Las actualizaciones simples (`update_tenant`) pueden ser manejadas directamente por la Edge Function mediante el cliente de Supabase Admin.

Este patrón desacopla completamente la interfaz de usuario de la lógica de negocio de la base de datos, permitiendo una mayor flexibilidad y un mantenimiento más sencillo.

#### 4.3.2. Cambio de Propietario del Sistema (System Owner)

**Justificación Estratégica:** La capacidad de cambiar qué tenant es el propietario (`is_system_owner`) de una plataforma es una operación crítica. La principal restricción es que solo puede existir **un único propietario por plataforma**. Para garantizar esta regla de negocio de forma atómica e indivisible, la lógica se ha centralizado en una función de base de datos (RPC), evitando así condiciones de carrera o estados de datos inconsistentes.

**Flujo de Datos:**

1.  **Interfaz de Usuario (`TenantsList.tsx`):** En la lista de tenants, cada fila muestra un componente `<Switch>` que refleja el estado `is_system_owner` del tenant. La interacción del superadministrador con este switch inicia todo el flujo.

2.  **Hook de React Query (`useSetSystemOwner`):**
    *   Al cambiar el estado del `<Switch>`, se invoca la mutación `useSetSystemOwner`, ubicada en `src/hooks/useTenants.ts`.
    *   Este hook es responsable de llamar a la Edge Function con el `payload` necesario (`tenantId` y `platformId`).
    *   En su `onSuccess`, invalida la query `['tenants']` para forzar un refresco de la lista, asegurando que la interfaz refleje el cambio de estado de manera inmediata.

3.  **Edge Function (`superadmin-actions`):**
    *   Se ha añadido una nueva acción `'set_system_owner'`.
    *   Recibe el `tenantId` y `platformId` desde el frontend.
    *   Su única responsabilidad es validar las entradas e invocar la función RPC correspondiente en la base de datos.

4.  **Lógica Atómica en Base de Datos (RPC):**
    *   El núcleo de la operación reside en la función `public.set_system_owner`. Esta función garantiza que el cambio de propietario sea una transacción atómica.
    *   **Paso 1:** Desmarca como propietario a cualquier otro tenant que pudiera estarlo para esa plataforma.
    *   **Paso 2:** Marca como propietario al nuevo tenant seleccionado.
    *   Este enfoque de "desmarcar primero, marcar después" dentro de una única función previene cualquier posibilidad de tener múltiples propietarios para una misma plataforma.

    ```sql
    -- supabase/migrations/xxxxxxxx_create_set_system_owner_rpc.sql
    CREATE OR REPLACE FUNCTION set_system_owner(
        p_new_owner_tenant_id UUID,
        p_platform_id UUID
    )
    RETURNS VOID LANGUAGE plpgsql AS $$
    BEGIN
        -- Desmarca al propietario anterior en la misma plataforma.
        UPDATE public.tenants
        SET is_system_owner = false
        WHERE platform_id = p_platform_id AND is_system_owner = true;

        -- Establece al nuevo propietario.
        UPDATE public.tenants
        SET is_system_owner = true
        WHERE id = p_new_owner_tenant_id;
    END;
    $$;
    ```

### 4.4. Gestión del Perfil de Usuario

La página "Mi Perfil" permite a un usuario autenticado gestionar su propia información. Para mantener la consistencia con la arquitectura del sistema, todas las operaciones de guardado se canalizan a través de la Edge Function `user-actions`.

#### 4.4.1. Flujo de Actualización de `user_metadata`

Los datos del perfil, como el nombre, el avatar o la configuración regional, se almacenan en el campo `user_metadata` del objeto `auth.users`. Para evitar la pérdida de datos al realizar actualizaciones parciales, se sigue un patrón de "lectura-fusión-escritura".

1.  **Acción en Edge Function:** Se utiliza una acción genérica `'update-user-settings'` dentro de `user-actions`.
2.  **Payload:** El frontend envía un `payload` que contiene el `userId` y un objeto `metadata` con los campos a actualizar (ej: `{ first_name: 'NuevoNombre' }` o `{ avatar_url: 'nueva-url' }`).
3.  **Fusión Segura en Backend:** La Edge Function primero lee el `user_metadata` completo del usuario. Luego, fusiona los datos existentes con los nuevos datos del payload. Esto asegura que los campos no incluidos en la petición no se borren accidentalmente.
4.  **Escritura:** Finalmente, llama a `supabase.auth.admin.updateUserById()` con el objeto de metadatos completo y fusionado.
5.  **Sincronización del Frontend:** Tras una actualización exitosa, el `AuthContext` en el frontend invoca `refreshUser()`, que fuerza una recarga de la sesión (`refreshSession()`) para obtener el token JWT actualizado con la nueva `user_metadata`, manteniendo así la consistencia en toda la aplicación.

#### 4.4.2. Flujo de Cambio de Contraseña (Usuario Autenticado)

1.  **Acción en Edge Function:** Se utiliza la acción `'update-password'`.
2.  **Payload:** El frontend envía el `userId` y la `newPassword`. No se requiere la contraseña actual.
3.  **Lógica de Backend:** La Edge Function, ejecutándose con privilegios de administrador, llama directamente a `supabase.auth.admin.updateUserById(userId, { password: newPassword })`. Esta es la forma segura y recomendada por Supabase para que un administrador (en este caso, nuestra función de backend) cambie la contraseña de un usuario.
4.  **Feedback al Usuario:** El frontend simplemente notifica al usuario que el cambio fue exitoso. La sesión del usuario permanece activa.

#### 4.4.3. Flujo de Cambio de Contexto (Asignación)

El contexto de trabajo de un usuario (el tenant y rol activos) está determinado por la **primera asignación** en el array `app_metadata.assignments`. Para cambiar de contexto, se reordena este array.

1.  **Acción en Edge Function:** Se utiliza la acción `'switch-assignment'`.
2.  **Payload:** El frontend (desde `ContextSwitcher.tsx`) envía el `userId` y el `newAssignmentId` de la asignación seleccionada.
3.  **Lógica de Backend:**
    a.  La Edge Function busca la asignación seleccionada dentro del array `assignments` del usuario.
    b.  Si la encuentra, reordena el array para que la asignación seleccionada quede en la primera posición (`assignments[0]`).
    c.  Guarda el array reordenado en la `app_metadata` del usuario.
4.  **Sincronización del Frontend:** El `AuthContext` llama a `refreshUser()`. Esto recarga la sesión, y como el `AuthContext` siempre lee la primera asignación como la activa, la interfaz se actualiza automáticamente para reflejar el nuevo contexto.

### 4.5. Configuración del Cliente y Persistencia de Sesión

**Justificación Estratégica:** Para garantizar una experiencia de usuario estándar y sin interrupciones en una Single-Page Application (SPA), es fundamental que la sesión del usuario persista entre recargas de la página. La no persistencia de la sesión obliga al usuario a iniciar sesión cada vez que refresca el navegador, lo cual es un comportamiento inaceptable.

**Problema Solucionado:** Se detectó que los usuarios (incluido el superadministrador) eran redirigidos a la página de inicio de sesión (`/auth`) cada vez que actualizaban el navegador en una ruta protegida.

**Causa Raíz:** La instancia del cliente de Supabase, configurada en `src/lib/supabaseClient.ts`, estaba inicializada con la opción `persistSession: false`. Esta configuración instruía explícitamente a Supabase a **no** guardar la información de la sesión en el almacenamiento local del navegador.

**Solución Implementada:** Se modificó la configuración del cliente para delegar el manejo de la sesión a Supabase, cambiando el valor a `true`. Esto permite que Supabase utilice el `localStorage` del navegador para mantener la sesión activa entre recargas.

```typescript
// src/lib/supabaseClient.ts

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true, // Permite que Supabase maneje la persistencia de la sesión.
    detectSessionInUrl: false,
  },
  // ...
});
```

Esta configuración es la correcta para el funcionamiento esperado de la aplicación web y resuelve el problema de los cierres de sesión inesperados.

## 5. Arquitectura de Planes y Activos Multiplataforma

**Justificación Estratégica:** El modelo original de planes de suscripción era global para todo el sistema. Con la evolución a una arquitectura multi-plataforma, este enfoque se volvió insostenible. Era imperativo que cada plataforma pudiera definir su propio conjunto de planes, características (activos) y precios de manera independiente. Esta refactorización desacopla la lógica de monetización, permitiendo que cada aplicación en el universo Glamtica tenga un modelo de negocio a medida.

### 5.1. Modelo de Datos

La nueva arquitectura se sustenta en tres pilares en la base de datos:

1.  **`subscription_plans` (Modificada):**
    *   Se añadió una columna `platform_id` (clave foránea a `platforms`). Esto vincula de forma inequívoca cada plan de suscripción a la plataforma a la que pertenece.

2.  **`plan_assets` (Nueva):**
    *   **Propósito:** Funciona como el "Catálogo de Activos" para una plataforma. Define qué características son medibles y limitables.
    *   **Ejemplo:** Para Glamtica, un activo puede ser `max_branches` ("Número de Sucursales"). Para otra aplicación, podría ser `api_calls_monthly`.
    *   **Campos Clave:** `platform_id`, `asset_key` (un identificador para el código), `name` (para la UI) y `data_type` ('numeric' o 'boolean').

3.  **`plan_asset_limits` (Nueva):**
    *   **Propósito:** Es la tabla que une las dos anteriores. Asigna un valor o límite específico a un activo para un plan determinado.
    *   **Ejemplo:** `{ plan_id: 'plan_basico', asset_id: 'asset_sucursales', value: '5' }`.

### 5.2. Lógica de Backend Centralizada

Toda la lógica de negocio para la gestión de planes, activos y precios ha sido implementada en la Edge Function `superadmin-actions`. Esto incluye nuevas acciones como:
-   `get_subscription_plans_by_platform`
-   `get_plan_assets_by_platform`
-   `update_plan_asset_limits`
-   `schedule_new_price`
-   `get_price_history_for_plan`

Este enfoque garantiza que toda la manipulación de datos se realiza de forma segura y centralizada, en lugar de estar dispersa en el frontend.

### 5.3. Flujo de Administración en la Interfaz

El panel de superadministrador fue rediseñado para reflejar esta nueva arquitectura contextual:

1.  **Punto de Entrada:** La gestión de planes y activos ya no es una sección global. El punto de partida es siempre la lista de **Plataformas** (`/superadmin/platforms`).
2.  **Acciones por Plataforma:** Cada plataforma en la lista ahora tiene botones dedicados:
    *   **Gestionar Planes:** Lleva a una vista que lista solo los planes de esa plataforma.
    *   **Catálogo de Activos:** Lleva a una interfaz para definir los activos (`plan_assets`) de esa plataforma.
3.  **Gestión Contextual:**
    *   **Formulario de Planes:** Al crear o editar un plan, el formulario ahora muestra dinámicamente los campos para los activos definidos en el catálogo de la plataforma, permitiendo al administrador establecer los límites (`plan_asset_limits`).
    *   **Gestión de Precios:** Desde la lista de planes, un nuevo botón lleva a una página dedicada para gestionar el historial de precios (`plan_price_history`) de ese plan específico, respetando el sistema de precios versionado existente.

## 6. Sistema de Precios y Tarifas Versionadas

**Justificación Estratégica:** El modelo de precios inicial, aunque funcional, carecía de la flexibilidad necesaria para gestionar cambios de precio a futuro de manera granular. Programar un cambio en el precio base de un plan era posible, pero no se podían programar cambios en los precios de los activos individuales (ej: aumentar el costo de una sucursal extra a partir del próximo trimestre). Para soportar un modelo de negocio escalable, se implementó un sistema de "Tarifas Versionadas".

Una **Tarifa** es una fotografía completa de todos los precios asociados a un plan de suscripción en un momento determinado. Esto incluye tanto el precio base del plan como los precios específicos de cada activo (costo por unidad extra y costo por excedente).

### 6.1. Modelo de Datos

El sistema de tarifas se sustenta en dos nuevas tablas que reemplazan al antiguo `plan_price_history`:

1.  **`price_tariffs` (Tarifas):**
    *   **Propósito:** Define una "versión" de la estructura de precios de un plan y cuándo entra en vigor.
    *   **Campos Clave:** `subscription_plan_id`, `effective_date` (la fecha en que esta tarifa se vuelve activa), y `base_price`.

2.  **`tariff_asset_prices` (Precios de Activos por Tarifa):**
    *   **Propósito:** Almacena los precios específicos de cada activo para una tarifa concreta.
    *   **Campos Clave:** `tariff_id` (vincula a una tarifa específica), `asset_id` (vincula a un activo del catálogo), `extra_unit_price`, y `overage_unit_price`.

Este modelo permite que un plan tenga múltiples tarifas programadas a futuro. Cuando llega la `effective_date` de una nueva tarifa, esta se convierte en la activa, con todos sus precios asociados.

### 6.2. Lógica de Backend y Flujo de Superadministrador

La gestión de este sistema se ha centralizado para garantizar la integridad de los datos y una experiencia de usuario fluida.

1.  **Lógica Centralizada:** La Edge Function `superadmin-actions` fue actualizada con dos nuevas acciones:
    *   `get_tariffs_for_plan`: Obtiene todas las tarifas (actual y futuras) de un plan, incluyendo los precios de los activos para cada una.
    *   `schedule_new_tariff`: Crea una nueva tarifa y todos sus precios de activos asociados de forma transaccional.

2.  **Flujo de Trabajo Unificado:**
    *   **Eliminación de Redundancia:** La página dedicada a "Gestionar Precios" fue eliminada.
    *   **Formulario Único:** Toda la gestión de un plan, incluyendo la programación de nuevas tarifas, se ha consolidado en el formulario de edición del plan (`PlanForm.tsx`).
    *   **Creación de la Primera Tarifa:** Para solucionar el problema de planes sin precio, al crear un nuevo plan, el sistema ahora crea automáticamente su **primera tarifa** con los precios de activos definidos en el formulario y una fecha de efectividad inmediata.
    *   **Programación de Nuevas Tarifas:** Desde el mismo formulario, el superadministrador puede abrir un diálogo para "Programar Nueva Tarifa". Este diálogo permite definir un nuevo precio base y una fecha de efectividad. El sistema captura los precios de los activos configurados en ese momento en el formulario y los asocia a la nueva tarifa, creando una "fotografía" completa de precios para el futuro.

## 7. Arquitectura de Configuración Multi-Plataforma

**Justificación Estratégica:** El modelo de configuración original del sistema era monolítico y se basaba en una única "configuración global". Este enfoque era incompatible con la arquitectura multi-plataforma, ya que impedía que cada aplicación (plataforma) definiera su propia configuración regional, de internacionalización y de mercado. Para resolver esta deuda técnica, se ha refactorizado el sistema para adoptar un modelo de configuración federado, donde cada plataforma es autónoma pero consume datos de catálogos maestros centralizados.

El nuevo modelo se basa en dos conceptos:

1.  **Configuración por Plataforma:** Cada plataforma ahora tiene su propia configuración específica.
2.  **Catálogos del Sistema:** La gestión de los datos maestros (como la lista de todos los países o monedas posibles) se ha centralizado en una sección dedicada.

### 7.1. Configuración por Plataforma (`PlatformSettings.tsx`)

La página `GlobalSettings.tsx` ha sido eliminada y reemplazada por un nuevo componente de configuración contextual, accesible desde la lista de plataformas.

-   **Ubicación:** `src/pages/Superadmin/Platforms/PlatformSettings.tsx`
-   **Acceso:** Desde la lista de plataformas (`/superadmin/platforms`), un nuevo ícono de engranaje en cada fila enlaza a `/superadmin/platforms/:platformId/settings`.

Esta página contiene dos pestañas principales:

#### Pestaña 1: General

Permite al superadministrador definir la configuración regional por defecto para una plataforma específica.

-   **Funcionalidad:** Muestra menús desplegables para seleccionar:
    -   Idioma por defecto.
    -   Moneda por defecto.
    -   Zona horaria por defecto.
-   **Flujo de Datos:** Al guardar, se invoca la acción `update_platform_settings` en la Edge Function, que actualiza las columnas correspondientes (`default_language_id`, `default_currency_id`, etc.) en la tabla `platforms`.

#### Pestaña 2: Países Disponibles

Permite al superadministrador definir en qué mercados puede operar una plataforma.

-   **Funcionalidad:** Muestra una lista de todos los países disponibles en el catálogo maestro del sistema. Cada país tiene un interruptor (`Switch`).
-   **Flujo de Datos:**
    -   Al **activar** un país, se invoca la acción `assign_country_to_platform`, que crea un registro en la nueva tabla de enlace `platform_countries`.
    -   Al **desactivar** un país, se invoca la acción `remove_country_from_platform`, que elimina el registro correspondiente.

### 7.2. Catálogos del Sistema (`SystemCatalogs.tsx`)

Para evitar la duplicación y mantener la consistencia, la gestión de los datos maestros se ha centralizado en una nueva página.

-   **Ubicación:** `src/pages/Superadmin/SystemCatalogs.tsx`
-   **Acceso:** A través de la nueva entrada "Catálogos del Sistema" en el menú de navegación del superadministrador (`/superadmin/system-catalogs`).

Esta página contiene pestañas para gestionar los CRUD de los catálogos principales del sistema:
-   **Países:** Gestiona la tabla `countries`.
-   **Monedas:** Gestiona la tabla `currencies`.
-   **Idiomas:** Gestiona la tabla `languages`.

Este enfoque separa claramente la **configuración de una plataforma** (qué moneda usa por defecto) de la **gestión de los datos maestros** (qué monedas existen en el sistema).

### 7.3. Modelo de Datos

El cambio más significativo en la base de datos es la introducción de una tabla de enlace para conectar plataformas y países.

```sql
-- supabase/migrations/20250729000003_create_platform_countries_join_table.sql
CREATE TABLE public.platform_countries (
    platform_id UUID NOT NULL,
    country_id UUID NOT NULL,
    created_at TIMESTAMptZ DEFAULT NOW() NOT NULL,

    CONSTRAINT platform_countries_pkey PRIMARY KEY (platform_id, country_id),
    CONSTRAINT platform_countries_platform_id_fkey FOREIGN KEY (platform_id) REFERENCES public.platforms(id) ON DELETE CASCADE,
    CONSTRAINT platform_countries_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id) ON DELETE CASCADE
);

COMMENT ON TABLE public.platform_countries IS 'Tabla de enlace para definir qué países están disponibles para cada plataforma.';
```

### 7.4. Lógica de Backend (`superadmin-actions`)

La Edge Function fue actualizada para incluir las siguientes acciones que soportan la nueva arquitectura:

-   `update_platform_settings`: Actualiza los campos de configuración (idioma, moneda, etc.) de una plataforma específica.
-   `get_countries_for_platform`: Devuelve un arreglo de IDs de los países asignados a una plataforma.
-   `assign_country_to_platform`: Crea la relación entre una plataforma y un país.
-   `remove_country_from_platform`: Elimina la relación entre una plataforma y un país.

#### 4.3.3. Gestión de Usuarios de un Tenant

**Justificación Estratégica:** Para que un superadministrador pueda gestionar un tenant, es fundamental tener una vista completa de todos los usuarios asociados a él. Dado que el sistema utiliza el sistema de autenticación nativo de Supabase, la información de los usuarios y sus asignaciones (membresías a tenants y roles) no reside en una tabla pública simple, sino que se distribuye entre la tabla `auth.users` y el campo `raw_app_meta_data` de cada usuario. Para consolidar esta información de manera eficiente y segura, se ha creado una función de base de datos (RPC) dedicada.

**Flujo de Datos:**

1.  **Interfaz de Usuario (`TenantUsersManager.tsx`):** El componente de la interfaz necesita mostrar una lista de usuarios para un `tenantId` específico. Para ello, invoca al hook `useTenantUsers`.

2.  **Hook de React Query (`useTenantUsers.ts`):** Este hook, siguiendo la arquitectura centralizada, no contiene lógica de base de datos. Su única responsabilidad es llamar a la Edge Function `superadmin-actions` con la acción `get_tenant_users` y el `tenantId` requerido.

3.  **Edge Function (`superadmin-actions`):**
    *   Recibe la acción `get_tenant_users`.
    *   Como capa de seguridad y orquestación, invoca a la función RPC `get_tenant_users` en la base de datos, pasándole el `tenantId`.

4.  **Lógica de Consolidación en Base de Datos (RPC):**
    *   El núcleo de la lógica reside en la función `public.get_tenant_users`. Esta función está diseñada para realizar la compleja tarea de "desempaquetar" y unir los datos de autenticación.
    *   **Paso 1:** Consulta la tabla `auth.users`.
    *   **Paso 2:** Utiliza la función `jsonb_array_elements` de PostgreSQL para expandir el array `assignments` que se encuentra en la columna `raw_app_meta_data` de cada usuario. Esto crea una fila virtual por cada asignación de cada usuario.
    *   **Paso 3:** Filtra estas filas para quedarse solo con aquellas cuya `tenant_id` en la asignación coincide con el `target_tenant_id` solicitado.
    *   **Paso 4:** Obtiene los datos de perfil del usuario (nombre, apellido) desde la columna `raw_user_meta_data`.
    *   **Paso 5:** Realiza un `LEFT JOIN` con las tablas `public.roles` y `public.branches` para obtener los nombres legibles por humanos correspondientes a los IDs de las asignaciones.
    *   **Resultado:** La función devuelve una tabla completa y fácil de consumir para el frontend, con una fila por cada asignación de usuario dentro del tenant especificado.

    ```sql
    -- supabase/migrations/xxxxxxxx_fix_get_tenant_users_name_source.sql
    CREATE OR REPLACE FUNCTION get_tenant_users(
      target_tenant_id uuid
    )
    RETURNS TABLE (...)
    LANGUAGE plpgsql
    SECURITY DEFINER -- Necesario para poder consultar auth.users
    AS $$
    BEGIN
      RETURN QUERY
      SELECT
        (user_assignment->>'assignment_id')::uuid,
        u.id as user_id,
        u.email::text,
        u.raw_user_meta_data->>'first_name' as first_name, -- Fuente de datos de perfil
        u.raw_user_meta_data->>'last_name' as last_name,   -- Fuente de datos de perfil
        (user_assignment->>'role_id')::uuid,
        r.name as role_name,
        r.display_name as role_display_name,
        (user_assignment->>'branch_id')::uuid,
        b.name as branch_name,
        user_assignment->>'status' as status
      FROM
        auth.users u,
        -- Expande el array de asignaciones en filas virtuales
        jsonb_array_elements(u.raw_app_meta_data->'assignments') as user_assignment
      LEFT JOIN
        public.roles r ON (user_assignment->>'role_id')::uuid = r.id
      LEFT JOIN
        public.branches b ON (user_assignment->>'branch_id')::uuid = b.id
      WHERE
        -- Filtra por el tenant de interés
        (user_assignment->>'tenant_id')::uuid = target_tenant_id;
    END;
    $$;
    ```

## 8. Dashboard de Superadministrador

**Justificación Estratégica:** El dashboard inicial del superadministrador presentaba dos limitaciones críticas: estaba diseñado para una única plataforma y sus métricas se basaban en suscripciones teóricas en lugar de pagos reales. Para alinear el dashboard con la arquitectura multi-plataforma y proporcionar datos financieros precisos, se llevó a cabo un rediseño completo. Adicionalmente, se sentaron las bases para un futuro dashboard destinado al rol de "Inversionista" (`investor`).

### 8.1. Arquitectura Multi-Plataforma y Basada en Pagos Reales

El nuevo dashboard soluciona los problemas anteriores mediante una arquitectura de backend y frontend más robusta y precisa.

**Flujo de Datos:**

1.  **Interfaz de Usuario (`SuperadminDashboard`):**
    *   El componente principal del dashboard, ubicado en `src/pages/Superadmin/index.tsx`, ahora incluye un selector (`SearchableSelect`) que permite al superadministrador filtrar las métricas por una plataforma específica o ver un consolidado de "Todas las Plataformas".
    *   El estado de este selector (`platformId`) se pasa al hook de datos para obtener las métricas correspondientes.

2.  **Hook de React Query (`useFinancialStats`):**
    *   El hook, ubicado en `src/hooks/useFinancialStats.ts`, fue modificado para aceptar un `platformId` opcional.
    *   Su `queryKey` ahora incluye el `platformId` (`['financial_stats', platformId]`) para que React Query gestione el caché de forma independiente para cada plataforma.
    *   Invoca a la nueva función RPC `get_platform_financial_stats`, pasando el `platformId` seleccionado.

3.  **Lógica de Backend Centralizada (RPC):**
    *   El núcleo de la nueva lógica reside en la función `public.get_platform_financial_stats`.
    *   **Multi-Plataforma:** La función acepta un `p_platform_id UUID`. Si se proporciona un ID, filtra los resultados para esa plataforma. Si es `NULL`, agrega los datos de todas las plataformas.
    *   **Precisión Financiera:** Todos los cálculos de ingresos (MRR, ARR, etc.) se basan ahora en la tabla `public.payment_intents`. Se aplican dos filtros cruciales para garantizar la precisión:
        1.  `status = 'COMPLETED'`: Solo se consideran los pagos que se completaron exitosamente.
        2.  `environment <> 'test'`: Se excluyen todos los pagos realizados en el entorno de prueba.
    *   **Monto Correcto:** La función lee la columna `amount_in_cents` y la divide por 100 para realizar los cálculos en la unidad monetaria principal (ej. pesos o dólares).

### 8.2. Bases para el Dashboard de Inversionistas

Para soportar la futura funcionalidad de un dashboard para el rol `investor`, se implementó la siguiente infraestructura:

1.  **Tabla de Participaciones (`investor_platform_shares`):**
    *   Se creó una nueva tabla para almacenar el porcentaje de participación que un inversor tiene sobre una plataforma específica.
    *   **Campos Clave:** `user_id`, `platform_id`, `investment_share` (un valor numérico como 0.15 para el 15%).
    *   **Seguridad:** La tabla está protegida por RLS. Solo los superadministradores pueden gestionar los registros.

2.  **Función RPC para Inversores (`get_investor_dashboard_data`):**
    *   Se creó una nueva función que recibe un `p_user_id` y un `p_platform_id`.
    *   **Lógica Interna:**
        1.  Busca la participación (`investment_share`) del inversor en la tabla `investor_platform_shares`.
        2.  Llama a la función principal `get_platform_financial_stats` para obtener las métricas totales de la plataforma.
        3.  Multiplica las métricas financieras (MRR, ARR) por el `investment_share` del inversor para calcular su participación en los ingresos.
    *   Esta función está lista para ser consumida por un futuro hook y componente de frontend para el dashboard del inversor.

## 9. Estándar de Acceso a Datos para Listas

**Justificación Estratégica:** Durante el desarrollo, se detectó una diferencia de rendimiento significativa entre la carga de la lista de "Tenants" y la de "Plataformas", incluso con muy pocos datos. La investigación reveló que la causa no era el volumen de datos, sino el **mecanismo de acceso** desde las Edge Functions.

Se ha determinado que las llamadas a funciones RPC de la base de datos (`supabase.rpc(...)`) son inherentemente más rápidas y eficientes que las consultas directas a tablas (`supabase.from(...).select(...)`). Esto se debe a que la RPC es una operación optimizada y precompilada dentro de la base de datos, mientras que la consulta directa debe pasar por la capa de la API de PostgREST, que introduce una sobrecarga de procesamiento.

Por lo tanto, para garantizar el máximo rendimiento y una experiencia de usuario fluida en toda la aplicación, se establece el siguiente patrón de diseño como el estándar obligatorio para la obtención de cualquier lista de datos.

### 9.1. Principio Fundamental

Toda lista de datos que se muestre en la interfaz (ej. tenants, plataformas, clientes, productos, citas, etc.) **DEBE** ser cargada a través de una función RPC dedicada en la base de datos, la cual debe soportar, como mínimo, la búsqueda del lado del servidor.

### 9.2. Implementación en 3 Capas

1.  **Capa de Base de Datos (PostgreSQL):**
    *   Se debe crear una función RPC (ej: `get_platforms_list`) que acepte un parámetro `p_search_term TEXT`.
    *   La función debe seleccionar únicamente las columnas estrictamente necesarias para la vista de lista.
    *   Debe incluir una cláusula `WHERE` para filtrar los resultados usando el `p_search_term`.
    *   **Ejemplo:**
        ```sql
        CREATE OR REPLACE FUNCTION get_platforms_list(p_search_term TEXT DEFAULT NULL)
        RETURNS TABLE (id uuid, name text, description text, base_url text)
        LANGUAGE plpgsql AS $$
        BEGIN
            RETURN QUERY SELECT p.id, p.name, p.description, p.base_url
            FROM public.platforms p
            WHERE (p_search_term IS NULL OR p.name ILIKE '%' || p_search_term || '%')
            ORDER BY p.created_at DESC;
        END;
        $$;
        ```

2.  **Capa de Backend (Edge Function):**
    *   La Edge Function (ej: `superadmin-actions`) debe actuar como un simple "pasamanos".
    *   Debe recibir la acción y el `payload` (que contiene el `searchTerm`).
    *   Su única responsabilidad es llamar a la función RPC correspondiente, pasándole el `searchTerm`.
    *   **Ejemplo:**
        ```typescript
        // case 'get_platforms':
        const { searchTerm } = payload || {};
        const { data, error } = await supabaseAdmin.rpc('get_platforms_list', {
          p_search_term: searchTerm
        });
        if (error) throw error;
        responseData = data;
        break;
        ```

3.  **Capa de Frontend (React):**
    *   Se debe crear un hook personalizado (ej: `usePlatforms`) que utilice `react-query`.
    *   El hook debe aceptar el `searchTerm` como parámetro y pasarlo en el `payload` de la llamada a la Edge Function. La `queryKey` de `react-query` debe incluir el `searchTerm` para gestionar el caché correctamente.
    *   El componente de la UI (ej: `PlatformsList.tsx`) debe contener un `Input` para la búsqueda.
    *   Se debe utilizar el hook `useDebounce` para evitar llamadas a la API en cada pulsación de tecla, enviando la petición solo cuando el usuario ha dejado de escribir.
    *   **Ejemplo:**
        ```typescript
        // PlatformsList.tsx
        const [searchTerm, setSearchTerm] = useState('');
        const debouncedSearchTerm = useDebounce(searchTerm, 300);
        const { data: platforms, isLoading } = usePlatforms(debouncedSearchTerm);

        // usePlatforms.ts
        export const usePlatforms = (searchTerm?: string) => {
          return useQuery({
            queryKey: ['platforms', searchTerm],
            queryFn: () => fetchPlatforms(searchTerm),
          });
        };
        ```
#### 4.3.4. Gestión de Plantillas de Correo

**Justificación Estratégica:** Para que cada plataforma pueda ofrecer una experiencia de comunicación consistente y de marca, es fundamental que el superadministrador pueda definir un conjunto de plantillas de correo maestras. Estas plantillas sirven como base para todas las notificaciones transaccionales (bienvenida, recuperación de contraseña, etc.) y pueden ser personalizadas por los tenants si la configuración lo permite.

**Flujo de Datos:**

1.  **Interfaz de Usuario (`PlatformSettings.tsx`):**
    *   Dentro de la página de configuración de cada plataforma, se ha añadido una nueva pestaña: "Plantillas de Correo".
    *   Esta pestaña renderiza el componente `EmailTemplatesPlatformTab.tsx`, que contiene toda la lógica de la interfaz.

2.  **Editor Visual Avanzado (Unlayer):**
    *   Para proporcionar una experiencia de usuario de primer nivel, se ha integrado el editor de correos `react-email-editor` (Unlayer).
    *   Este editor permite al superadministrador construir plantillas de correo atractivas y responsives mediante un sistema de **arrastrar y soltar (Drag & Drop)**, eliminando la necesidad de escribir HTML.
    *   Al guardar, no se almacena el HTML final, sino la **estructura JSON** del diseño de Unlayer. Esto es crucial, ya que permite que las plantillas puedan ser recargadas en el editor para futuras modificaciones de forma visual.

3.  **Hook de React Query (`usePlatformEmailTemplates`):**
    *   Este hook, ubicado en `src/hooks/useEmailTemplates.ts`, es el responsable de obtener los datos.
    *   Recibe un `platformId` como parámetro.
    *   Invoca la Edge Function `superadmin-actions` con la acción `get_platform_email_templates`.

4.  **Lógica de Backend Centralizada (Edge Function):**
    *   La Edge Function `superadmin-actions` ha sido extendida para incluir un CRUD completo para las plantillas de correo:
        *   `get_platform_email_templates`: Obtiene todas las plantillas maestras asociadas a un `platformId`.
        *   `create_platform_email_template`: Crea una nueva plantilla, asociándola a la plataforma y a su tenant propietario.
        *   `update_platform_email_template`: Actualiza una plantilla existente.
        *   `delete_platform_email_template`: Elimina una plantilla.
    *   Toda la interacción con la tabla `public.email_templates` se realiza de forma segura a través de esta función, que se ejecuta con los máximos privilegios.

**Modelo de Datos y Reglas de Negocio:**

La tabla `public.email_templates` incluye campos para controlar el comportamiento de las plantillas a nivel de tenant:
-   `is_customizable`: Un booleano que define si los tenants de la plataforma pueden crear sus propias versiones de esta plantilla.
-   `is_disableable`: Un booleano que define si los tenants pueden desactivar el envío de este tipo de correo.