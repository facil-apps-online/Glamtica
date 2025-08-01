## Plan de Acción: Creación de Usuarios de Tenant (Basado en `auth.users` `app_metadata` y `user-actions` Edge Function)

**Objetivo:** Implementar la creación y asignación de usuarios de tenant, utilizando el "email sintético" para `auth.users` y almacenando todas las asignaciones (incluyendo `tenant_id`, `role_id`, `branch_id` y `status`) directamente en la `app_metadata` del usuario en `auth.users`, orquestado a través de la Edge Function `user-actions`.

**Fase 1: Reconfirmar Arquitectura (Completada - Clarificación del Usuario)**
*   **Conclusión Clave:** `auth.users` es la única fuente de verdad. `public.users` y `public.user_assignments` están deprecadas. Todas las asignaciones (tenant, rol, sucursal, estado) se almacenan en `auth.users.app_metadata.assignments`. El email real del usuario se almacena en `auth.users.user_metadata.real_email`.

**Fase 2: Modificar la Edge Function `user-actions` (Lógica Central) - **COMPLETADA**

1.  **Crear una Nueva Acción en `user-actions`:**
    *   **Objetivo:** Implementar la lógica de orquestación para la creación/búsqueda de usuarios en `auth.users` y la gestión de asignaciones en `app_metadata`.
    *   **Acción:**
        *   Leer el contenido de `supabase/functions/user-actions/index.ts`.
        *   Añadir una nueva acción (ej. `'invite_or_assign_user_to_tenant'`) que reciba el `payload` necesario.
        *   **Entrada (Payload REVISADA)**: La acción recibirá los siguientes datos en su `payload`:
            *   `email`: El email real del usuario (obligatorio).
            *   `password`: Contraseña del usuario (obligatorio solo si es un usuario completamente nuevo).
            *   `tenantId`: ID del tenant al que se asignará el usuario (obligatorio).
            *   `roleId`: ID del rol que se asignará al usuario dentro del tenant (obligatorio).
            *   `branchId`: ID de la sucursal a la que se asignará el usuario (obligatorio).
            *   `platformId`: ID de la plataforma a la que pertenece el tenant (obligatorio).
            *   `firstName`: Nombre del usuario (OPCIONAL).
            *   `lastName`: Apellido del usuario (OPCIONAL).
        *   **Validación Inicial REVISADA**: Se validará que `email`, `tenantId`, `roleId`, `branchId`, `platformId` estén presentes. La `password` será obligatoria solo si el usuario es nuevo.
        *   **Lógica dentro de la acción REVISADA**:
            *   Obtener `platform_id` del payload.
            *   Construir el `synthetic_email`.
            *   **Escenario 1: Nuevo Usuario (se proporciona `password`)**
                *   Intentar crear el usuario en `auth.users` (`supabaseAdmin.auth.admin.createUser`).
                *   Parámetros: `email: synthetic_email`, `password: password`.
                *   `user_metadata`: `{ real_email: email }`. **Solo se incluirán `firstName` y `lastName` si se proporcionan en el payload.**
                *   Manejar "User already registered" error: si ocurre, tratar como usuario existente y proceder a buscarlo.
            *   **Escenario 2: Usuario Existente (NO se proporciona `password`)**
                *   Buscar al usuario en `auth.users` por `synthetic_email` (`supabaseAdmin.auth.admin.listUsers`).
                *   Si no se encuentra, lanzar un error.
                *   Si se encuentra, verificar que `user_metadata.real_email` coincida con el `email` real proporcionado.
            *   **Gestión de Asignaciones en `app_metadata`**:
                *   Recuperar `app_metadata.assignments` actual.
                *   Verificar duplicados de asignación para el `tenantId`.
                *   Crear `newAssignment` con `assignment_id`, `tenant_id`, `role_id`, `branch_id`, `status`.
                *   Actualizar `app_metadata.assignments`.
                *   Actualizar usuario en `auth.users`.

**Fase 3: Modificar `src/hooks/useInviteOrAssignUser.ts` - **COMPLETADA**

1.  **Adaptar el Hook para llamar a `user-actions`:**
    *   **Objetivo:** Adaptar el hook para que invoque la nueva acción en `user-actions`.
    *   **Acción:** Cambiar la llamada `supabase.rpc(...)` a una llamada a la Edge Function `user-actions` con la nueva acción y el payload adecuado.

**Fase 4: Ajustar `src/components/AddUserDialog.tsx` - **COMPLETADA**

1.  **Actualizar Lógica de `checkUserExists`:**
    *   **Objetivo:** Modificar `checkUserExists` para que verifique la existencia del usuario en `auth.users` utilizando el `synthetic_email`.
    *   **Acción:**
        *   Modificar `checkUserExists` para construir el `synthetic_email`.
        *   Llamar a la Edge Function `user-actions` con una nueva acción (ej. `'check_user_exists_in_auth'`) que consulte `auth.users` por `email` (email sintético).

**Fase 5: Verificación y Pruebas**

1.  **Pruebas Exhaustivas:**
    *   Probar la creación de un usuario completamente nuevo (no en `auth.users`).
    *   Probar la invitación de un usuario existente (ya en `auth.users`, pero sin una asignación al tenant actual).
    *   Probar la invitación de un usuario que ya tiene una asignación al tenant actual (debería fallar con un mensaje apropiado).
    *   Verificar las entradas en `auth.users`: `email` (sintético), `user_metadata` (`real_email`, `firstName`, `lastName`), `app_metadata` (array `assignments` con `tenant_id`, `role_id`, `branch_id`, `status` correctos).
    *   Asegurar que el `AddUserDialog` refleje correctamente `userExists` basándose en la verificación de `auth.users`.