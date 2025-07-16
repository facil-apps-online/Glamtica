# Tarea: Rediseño del Flujo de Cambio de Contraseña (Completada)

Se ha rediseñado por completo el sistema de cambio de contraseña para mejorar la seguridad y la experiencia de usuario.

**Fase 1: Entendimiento Profundo del Flujo Actual (Completada)**
- [x] **Analizar `AuthContext.tsx`**: Se confirmó el uso de un sistema de autenticación personalizado basado en JWT y RPC, sin utilizar la gestión de sesiones nativa de Supabase.
- [x] **Analizar `login_user` RPC**: Se encontró y analizó la función en los archivos de migración, identificando el uso de `pgcrypto` con `crypt()` для el hashing de contraseñas.

**Fase 2: Implementación del Nuevo Flujo (Completada)**
- [x] **Crear Nueva Función RPC `change_password`**: Se creó y aplicó una nueva función SQL `change_password` que replica la lógica de hashing de `login_user` para una verificación y actualización seguras.
- [x] **Versionar la Función**: La nueva función se guardó en el archivo de migración `supabase/migrations/20250716120000_create_change_password_function.sql`.
- [x] **Actualizar Hook `useUpdatePassword`**: Se modificó el hook para llamar a la nueva función RPC.
- [x] **Forzar Cierre de Sesión**: Se implementó la llamada a `logout()` directamente en el `onSuccess` del hook, garantizando que el usuario deba volver a iniciar sesión.
- [x] **Ajustar `SecurityTab.tsx`**: Se actualizó el componente para pasar los parámetros correctos y mostrar un mensaje de éxito informativo al usuario.
