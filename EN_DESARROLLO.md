# Funcionalidades en Desarrollo

Este documento registra las funcionalidades que están actualmente en proceso de implementación, su estado actual, los avances y los pasos pendientes.

---

## Integración con Almacenamiento en la Nube (Google Drive / OneDrive)

### 1. Objetivo

Permitir que cada tenant conecte su propia cuenta de Google Drive o Microsoft OneDrive para almacenar los archivos de la aplicación (ej. avatares de usuarios, fotos de servicios, etc.). Esto le da al tenant control sobre sus datos y elimina la preocupación por los límites de almacenamiento en Supabase Storage.

### 2. Estado Actual: **En Desarrollo (Pausado)**

Se ha avanzado en la implementación de la integración con **Google Drive**, pero se encuentra pausada a la espera de resolver la configuración del flujo de autenticación OAuth 2.0.

### 3. Avances Realizados

#### 3.1. Backend
- **Tabla de Integraciones:** Se creó la tabla `public.tenant_integrations` para almacenar de forma segura los tokens de acceso y de refresco de cada tenant para cada proveedor (Google, Microsoft, etc.). La migración correspondiente es `20250714003029_create_tenant_integrations_table.sql`.
- **Función de Autorización:** Se creó la función RPC `public.get_google_auth_url(p_tenant_id UUID)`. Esta función:
  - Lee de forma segura el `GOOGLE_CLIENT_ID` desde el Vault de Supabase.
  - Construye la URL de consentimiento de Google, incluyendo los scopes necesarios (`drive.file`, `userinfo.email`) y el `tenant_id` en el parámetro `state` para poder identificar al tenant en el callback.
  - La migración correspondiente es `20250714005322_update_google_auth_url_with_state.sql`.

#### 3.2. Frontend
- **UI de Conexión:** Se implementó la interfaz de usuario en la página de "Detalles del Tenant" (`TenantDetails.tsx`).
  - Se muestra una tarjeta de "Integraciones de Almacenamiento".
  - El botón "Conectar" llama a la función RPC `get_google_auth_url` y redirige correctamente al superadministrador a la página de consentimiento de Google.
- **Flujo de Autorización (Iniciado):** El superadministrador puede seleccionar una cuenta de Google y autorizar los permisos solicitados por la aplicación.

### 4. Pasos Pendientes (Bloqueo Actual)

El flujo se detiene después de que el usuario autoriza la aplicación en la pantalla de consentimiento de Google. Google redirige correctamente a la `Redirect URI` que hemos definido (`http://localhost:5173/integrations/google/callback`), pero nos falta implementar la lógica para manejar esta redirección.

**Tareas Pendientes para Completar la Integración con Google Drive:**

1.  **Crear la Página de Callback:**
    -   Crear el componente de página `src/pages/integrations/google/Callback.tsx`.
    -   Esta página debe extraer el `code` (código de autorización) y el `state` (nuestro `tenant_id`) de los parámetros de la URL.

2.  **Crear la Edge Function de Intercambio de Tokens:**
    -   Crear una nueva Edge Function (ej. `google-oauth-token`).
    -   La página de callback llamará a esta función, pasándole el `code` y el `tenant_id`.
    -   **Lógica de la Edge Function:**
        -   Debe leer el `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` del Vault.
        -   Debe hacer una llamada segura de servidor a servidor a la API de Google (`https://oauth2.googleapis.com/token`).
        -   Enviará el `code`, `client_id`, `client_secret`, `redirect_uri` y `grant_type='authorization_code'`.
        -   Google le devolverá un `access_token` y un `refresh_token`.
        -   La función debe **encriptar el `refresh_token`** usando `pgcrypto` antes de guardarlo.
        -   Finalmente, debe hacer un `INSERT` o `UPDATE` en la tabla `tenant_integrations` con los tokens y el email del usuario asociado al `tenant_id`.

3.  **Implementar la Lógica de Subida de Archivos:**
    -   Modificar los flujos de subida de archivos (ej. `AvatarUploader`) para que:
        1.  Verifiquen si el tenant tiene una integración activa.
        2.  Si es así, obtengan un `access_token` válido (usando el `refresh_token` para generar uno nuevo si es necesario).
        3.  Usen el `access_token` para subir el archivo a la API de Google Drive en lugar de a Supabase Storage.
        4.  Guarden el ID o el enlace del archivo de Drive en la base de datos de Glamtica.
