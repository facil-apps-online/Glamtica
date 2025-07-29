
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
