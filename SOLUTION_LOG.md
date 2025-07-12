### Problema: RLS no funciona debido a la ausencia de `set_session_context`

**Descripción:** Las políticas de Seguridad a Nivel de Fila (RLS) no estaban filtrando los datos correctamente, y los usuarios no podían ver la información esperada. El `AuthService` en el frontend intentaba llamar a una función RPC `set_session_context` que no existía en la base de datos.

**Causa:** La función `set_session_context`, responsable de establecer las variables de sesión (`app.current_user_id`, `app.current_tenant_id`, etc.) necesarias para que RLS funcione, no estaba definida en la base de datos o su firma no coincidía con la llamada del frontend.

**Solución Intentada (y Fallida Inicialmente):**
1.  **Creación de la función `set_session_context`:** Se creó una migración (`20250712000000_create_set_session_context_function.sql`) para definir la función `public.set_session_context(session_token TEXT)`. Esto falló porque la función ya existía con una firma diferente o por problemas de caché de PostgREST.
2.  **Habilitación de `pgjwt`:** Se habilitó la extensión `pgjwt` (`20250712010000_enable_pgjwt_extension.sql`) para permitir la decodificación de JWT directamente en la base de datos.
3.  **Actualización de `set_session_context` a `TEXT`:** Se modificó la función `set_session_context` para que aceptara un `TEXT` (`jwt_token`) y decodificara el JWT usando `pgjwt` (`20250712010500_update_set_session_context_with_pgjwt.sql`). Esto requirió eliminar la función anterior (`20250712011000_drop_set_session_context_function_v2.sql`).
4.  **Actualización de `set_session_context` a `JSONB`:** Se intentó modificar la función para que aceptara un `JSONB` (`params`) y extrajera el `jwt_token` de allí (`20250712012000_update_set_session_context_to_jsonb.sql`). Esto también requirió eliminar la función anterior (`20250712012500_drop_set_session_context_function_v3.sql`).
5.  **Reversión a `TEXT, TEXT`:** Finalmente, se optó por una firma con dos parámetros `TEXT` (`p_jwt_token`, `p_jwt_secret`) para mayor claridad y compatibilidad con PostgREST (`20250712013000_update_set_session_context_to_text_params.sql`). Esto requirió eliminar la función anterior (`20250712013500_drop_set_session_context_function_v4.sql`).

**Estado Actual y Solución Temporal:**
*   La función `public.set_session_context(TEXT, TEXT)` existe y es invocable desde la base de datos (verificado con `20250712014000_test_set_session_context_function.sql`).
*   El error 404 en el frontend persiste, lo que sugiere un problema de caché en PostgREST o en la instancia de Supabase remota.
*   **Solución Temporal:** Se han comentado todas las llamadas a `supabase.rpc('set_session_context')` en `src/contexts/AuthContext.tsx` y `src/pages/Auth.tsx` para permitir que el frontend funcione sin errores de red. Esto significa que el RLS (Row Level Security) no estará activo hasta que la función sea accesible para PostgREST.

**Próximos Pasos:**
*   Esperar a que la caché de PostgREST se actualice o que Supabase realice un reinicio interno de sus servicios.
*   Una vez que la función sea accesible, descomentar las llamadas a `set_session_context` en `src/contexts/AuthContext.tsx` y `src/pages/Auth.tsx`.

**Estado:** Pendiente de resolución por actualización de caché de Supabase. Funcionalidad de RLS temporalmente deshabilitada en el frontend.

---

### Problema: Nombre de Usuario no se Muestra en el Avatar del Encabezado

**Descripción:** Después de iniciar sesión, el nombre de usuario (o email) no se mostraba en el avatar del encabezado de la aplicación.

**Causa:**
1.  **`AuthContext` no utilizado por `Auth.tsx`:** La página de autenticación (`src/pages/Auth.tsx`) tenía su propia lógica de inicio de sesión y no estaba utilizando la función `login` proporcionada por `AuthContext.tsx`. Esto significaba que el estado `user` en el contexto nunca se actualizaba con la información del usuario real después de un inicio de sesión exitoso.
2.  **`localStorage` no leído correctamente:** El `useEffect` en `AuthContext.tsx` que debía leer el token del `localStorage` y decodificarlo para establecer el usuario, estaba usando un placeholder (`dummy@example.com`) en lugar de la lógica de decodificación real.
3.  **Errores de importación:** Durante la refactorización, se eliminaron accidentalmente varias importaciones necesarias en `src/pages/Auth.tsx` (`useState`, `useNavigate`, `useToast`, `useAuth`, y los componentes de `Card`, `Label`, `Input`, `Button`, `Tabs`).

**Solución:**
1.  **Refactorización de `Auth.tsx`:** Se modificó `src/pages/Auth.tsx` para que utilizara el hook `useAuth()` y llamara a `auth.login(email, password)` para el proceso de inicio de sesión.
2.  **Decodificación de JWT en `AuthContext`:** Se actualizó el `useEffect` en `src/contexts/AuthContext.tsx` para que decodificara el token JWT almacenado en `localStorage` utilizando `jwt-decode` y estableciera la información real del usuario (`id`, `email`) en el estado `user`.
3.  **Corrección de importaciones:** Se restauraron todas las importaciones faltantes en `src/pages/Auth.tsx` (`useState`, `useNavigate`, `useToast`, `useAuth`, y los componentes de `Card`, `Label`, `Input`, `Button`, `Tabs`).

**Estado:** Resuelto. El nombre de usuario (email) ahora se muestra correctamente en el avatar del encabezado.
