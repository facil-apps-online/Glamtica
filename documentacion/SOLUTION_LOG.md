---
### Problema: Violación de clave foránea al conectar Google Drive para Superadmin

**Fecha:** 13 de julio de 2025

**Descripción:** Al intentar conectar Google Drive para el superadministrador, la Edge Function `google-oauth-token` fallaba con el error `23503` (violación de clave foránea) y el mensaje `Key (tenant_id)=(00000000-0000-0000-0000-000000000000) is not present in table "tenants".`

**Causa Raíz:** La tabla `public.tenant_integrations` tiene una clave foránea que referencia a `public.tenants(id)`. Cuando se intentó insertar una integración para el superadministrador con el `tenant_id` `00000000-0000-0000-0000-000000000000`, este ID no existía en la tabla `public.tenants`, lo que provocó la violación de la restricción.

**Solución:** Se insertó un registro en la tabla `public.tenants` con el ID `00000000-0000-0000-0000-000000000000` para satisfacer la clave foránea.

**Consulta SQL aplicada:**
```sql
INSERT INTO public.tenants (id, name, subscription_status)
VALUES ('00000000-0000-0000-0000-000000000000', 'Global System Tenant', 'active')
ON CONFLICT (id) DO NOTHING;
```

**Lección Aprendida:** Cualquier `tenant_id` utilizado en `tenant_integrations` (incluidos los IDs globales para superadministradores) debe existir previamente en la tabla `public.tenants` debido a la restricción de clave foránea.
---
### Problema: El cliente de Supabase no utilizaba el token de autenticación en las peticiones.

**Fecha:** 14 de julio de 2025

**Descripción:** Aunque el token de autenticación se guardaba en el almacenamiento local, el cliente de Supabase no lo utilizaba automáticamente en las cabeceras de las peticiones, lo que resultaba en que las consultas no devolvieran resultados debido a la falta de autenticación.

**Causa Raíz:** El cliente de Supabase no estaba siendo configurado dinámicamente con el token de autenticación después de que el usuario iniciara sesión o se refrescara el token. Al no usar `supabase.auth` directamente, la gestión de la cabecera `Authorization` debía hacerse manualmente.

**Solución:** Se modificó `src/contexts/AuthContext.tsx` para inyectar y eliminar la cabecera `Authorization` del cliente `supabase.global.headers` en los momentos adecuados:
1.  En `updateUserFromToken`: Se añadió `supabase.global.headers['Authorization'] = `Bearer ${token}`;` para asegurar que el token se use en todas las peticiones subsiguientes.
2.  En `logout`: Se añadió `delete supabase.global.headers['Authorization'];` para limpiar la cabecera al cerrar la sesión.

**Lección Aprendida:** Cuando se gestiona la autenticación de forma personalizada sin depender directamente de los métodos de autenticación de Supabase (como `supabase.auth.signIn`), es crucial manejar manualmente la inyección del token JWT en las cabeceras globales del cliente de Supabase para que las peticiones autenticadas funcionen correctamente.