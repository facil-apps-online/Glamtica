
---

## Tarea: Refactorización del Formulario de Planes y Precios

**Objetivo:** Mejorar la usabilidad y claridad del formulario de gestión de planes (`PlanForm.tsx`) dividiendo su contenido en pestañas lógicas.

**Fases:**

1.  **Análisis (Completado):** Se ha determinado que el formulario actual es demasiado denso y se beneficiaría de una reestructuración visual.
2.  **Implementación de Pestañas (Completado):**
    *   **Tarea:** Modificar `PlanForm.tsx`.
    *   **Detalles:**
        *   Se introdujo el componente `Tabs` de la librería de UI del proyecto.
        *   Se creó la pestaña **"General"** para los detalles básicos del plan (nombre, descripción, estado).
        *   Se creó la pestaña **"Activos y Límites"** para la configuración detallada de cada activo (límites, precios, bonificaciones).
        *   Se creó la pestaña **"Tarifas y Precios"** para la gestión de tarifas versionadas (ver precios actuales/futuros y programar nuevos).
        *   Se aseguró que el formulario se pueda enviar como una unidad desde fuera de las pestañas.
3.  **Pendiente - Verificación:** El usuario debe probar el nuevo diseño del formulario y confirmar que es más intuitivo y que toda la funcionalidad de guardado sigue operando correctamente.

---
## Desarrollo: Gestión de Accesos Avanzada (Investor y App Super Admin)

**Objetivo:** Implementar los roles `investor` y `app_super_admin` con permisos restringidos a plataformas específicas, gestionados desde el portal de superadministración.

### Fase 1: Base de Datos
- [x] Crear y aplicar la migración para la tabla `investor_platform_shares`. (Verificado, ya existe)
- [ ] Crear y aplicar la migración para la función RPC `get_platform_level_assignments`.

### Fase 2: Backend (Edge Function)
- [ ] Implementar la acción `get_platform_level_assignments` en `superadmin-actions`.
- [ ] Implementar la acción `assign_platform_role` en `superadmin-actions`.
- [ ] Implementar la acción `remove_platform_assignment` en `superadmin-actions`.

### Fase 3: Frontend (UI)
- [ ] Crear el hook `usePlatformLevelAssignments`.
- [ ] Rediseñar `AccessManagementPage.tsx` para listar usuarios con roles especiales.
- [ ] Construir el modal de asignación de roles con lógica condicional para `investor` y `app_super_admin`.

### Fase 4: Seguridad y Acceso (RLS)
- [ ] Actualizar políticas RLS de tablas críticas (`platforms`, `tenants`, etc.) para los nuevos roles.
- [ ] Adaptar la lógica del frontend (UI y hooks) para que sea consciente del contexto de acceso reducido.
