# Tarea: Implementar vista responsive (mobile-first) para el Gestor de Integraciones

**Objetivo:** Crear una vista optimizada para móviles en la página de `Integraciones`, mostrando los proveedores en tarjetas individuales en lugar del acordeón, de acuerdo con las convenciones de diseño del proyecto.

---

### Fases de la Tarea

1.  **Análisis y Planificación - [COMPLETADO]**
    - [x] Se ha definido la necesidad de una vista móvil.
    - [x] Se ha creado un plan detallado para refactorizar la vista actual y añadir la nueva.

2.  **Implementación - [COMPLETADO]**
    - [x] Importar y usar el hook `useScreenSize`.
    - [x] Crear el componente `IntegrationCard` para la vista móvil.
    - [x] Crear el componente `IntegrationsMobileView` que usará las tarjetas.
    - [x] Refactorizar la vista de acordeón actual en un componente `IntegrationsDesktopView`.
    - [x] Implementar el renderizado condicional en `IntegrationsPage` para alternar entre las vistas.

3.  **Verificación Final - [PENDIENTE]**
    - [ ] Comprobar que la vista móvil se muestra correctamente en pantallas pequeñas.
    - [ ] Comprobar que la vista de escritorio no ha sufrido regresiones.
