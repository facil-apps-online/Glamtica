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
