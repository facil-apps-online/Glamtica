# Plan de Mejoras para la Gestión de Usuarios del Tenant

Este documento detalla el plan de acción para mejorar la funcionalidad de gestión de usuarios dentro de un tenant.

---

## Fase 1: Verificación y Corrección del Origen de Datos (Completada)

**Objetivo:** Asegurar que la lista de usuarios se obtiene exclusivamente a través de la Edge Function `tenant-actions`.

- [x] **1.1: Analizar `useTenantUsers.ts`**: Revisar el hook para confirmar que llama a la Edge Function `tenant-actions` con la acción `get_users_for_tenant`.
- [x] **1.2: Analizar `tenant-actions`**: Inspeccionar la Edge Function para asegurar que maneja correctamente la acción `get_users_for_tenant`.
- [x] **1.3: Corregir si es necesario**: No se necesitaron correcciones.

---

## Fase 2: Lógica de Roles y Sucursales en el Formulario (Completada)

**Objetivo:** Mejorar la UX del formulario de invitación, haciendo que la selección de sucursal sea condicional al rol.

- [x] **2.1: Analizar `AddUserDialog.tsx`**: Estudiar el componente para entender el manejo del formulario.
- [x] **2.2: Implementar Lógica Condicional**: Modificar el formulario para que el campo "Sucursal" se deshabilite si el rol seleccionado es `tenant_super_admin`.
- [x] **2.3: Enviar `null` para Sucursal**: Asegurar que el valor de la sucursal se envíe como `null` para el rol de superadministrador.

---

## Fase 3: Validación de Duplicados en el Backend (Completada)

**Objetivo:** Impedir que un usuario sea asignado dos veces al mismo negocio.

- [x] **3.1: Revisar `user-actions` Edge Function**: Se ha revisado y refactorizado la acción `invite_or_assign_user_to_tenant`.
- [x] **3.2: Añadir Verificación de Existencia**: La lógica de verificación ya existía y se ha mantenido.
- [x] **3.3: Devolver Error Claro**: El backend ya devuelve un error claro si la asignación existe.

---

## Fase 4: Implementación de Búsqueda de Usuarios (Completada)

**Objetivo:** Facilitar la administración añadiendo una funcionalidad de búsqueda en la lista de usuarios.

- [x] **4.1: Analizar `TenantUsersManager.tsx`**: Se ha añadido un `Input` de búsqueda en el `CardHeader`.
- [x] **4.2: Añadir Estado de Búsqueda**: Se ha introducido el estado `searchTerm` para controlar el valor del input.
- [x] **4.3: Añadir Input de Búsqueda**: El componente `Input` se ha añadido a la UI con un ícono de búsqueda.
- [x] **4.4: Filtrar Resultados**: El `useMemo` que calcula `groupedUsers` ahora filtra los resultados en tiempo real.
