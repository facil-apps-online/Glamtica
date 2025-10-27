
# EN DESARROLLO

Este documento sigue el progreso de las tareas de desarrollo activas.

---

## Fase 1: Estandarización y Mejora de CRUDs

**Objetivo:** Unificar la experiencia de usuario para la gestión de entidades maestras, implementando patrones consistentes y añadiendo la funcionalidad de "Edición Completa" donde no existía.

### Módulo de Productos (Completado)

- **Estado:** Finalizado.
- **Descripción:** Se refactorizó la gestión de productos para introducir un patrón de "Edición Rápida" (modal) y "Edición Completa" (página dedicada).

### Módulo de Servicios (Completado)

- **Estado:** Finalizado.
- **Descripción:** Se aplicó el mismo patrón de refactorización al módulo de servicios.

### Módulo de Combos (Completado)

- **Estado:** Finalizado.
- **Descripción:** Se añadió la funcionalidad de **Edición Completa** para los combos, manteniendo la "Edición Rápida" (modal) existente para la creación y edición básica.
- **Flujo de Trabajo Resultante:**
    - **Nuevo Combo:** Se utiliza el modal de edición rápida (`ComboDialog`).
    - **Editar (Rápido):** Se utiliza el mismo modal (`ComboDialog`).
    - **Edición Completa:** Se navega a una nueva página dedicada (`/combos/edit/:id`).
- **Componentes Creados/Modificados:**
    - `CombosPage.tsx`: Se añadió la opción "Edición Completa" al menú de acciones de cada combo.
    - `EditComboPage.tsx`: Nueva página creada para la edición a pantalla completa, reutilizando la lógica de formulario del `ComboDialog`.
    - `ComboDialog.tsx`: Se mantuvo su funcionalidad original para la creación y edición rápida.
    - `App.tsx`: Se añadió la ruta `/combos/edit/:id`.

---

## Fase 2: El Chatter Contextual (Pendiente)

**Objetivo:** Implementar un feed de actividad, auditoría y colaboración (el "chatter") en todos los CRUDs y vistas de configuración importantes del sistema.

### Inventario de CRUDs y Vistas a Integrar

- **Gestión de Clientes:**
    - [x] Clientes (Prototipo completado)
- **Gestión de Ventas y Citas:**
    - [ ] Atenciones/Citas
    - [ ] Ventas (POS)
- **Catálogo y Precios:**
    - [x] Productos (Maestro)
    - [x] Servicios (Maestro)
    - [x] Combos (Maestro)
    - [x] Categorías (Productos y Servicios)
    - [ ] Marcas de Productos
    - [ ] Impuestos
- **Gestión de Inventario y Proveedores:**
    - [x] Proveedores
    - [ ] Compras
    - [ ] Transferencias de Productos
- **Gestión de Personal y Sucursales:**
    - [ ] Usuarios
    - [ ] Sucursales
    - [ ] Asignación de Comisiones (por producto, servicio y usuario)
- **Gestión de Equipamiento:**
    - [ ] Equipos
    - [ ] Tipos de Equipo
    - [ ] Marcas de Equipo
- **Configuración (Auditoría de Cambios):**
    - [ ] Configuración General del Tenant
    - [ ] Configuración por Sucursal

---

## Fase 3: El Chat Interno (Pendiente)

**Objetivo:** Desarrollar un sistema de mensajería instantánea 1 a 1 y grupal.

---
---

# Tareas Pendientes (Backlog)

A continuación se listan las tareas de desarrollo que han quedado pendientes por estar fuera del alcance de proyectos anteriores.

## UI para Configurar `client_google_gmail`

- **Tarea:** Adaptar la interfaz de usuario de integraciones para permitir a los tenants conectar una cuenta de Gmail específica para la comunicación con clientes bajo el nuevo tipo de proveedor `client_google_gmail`.
- **Estado:** Pospuesto, ya que la UI reside en otro proyecto.

## UI para Configurar Credenciales de WhatsApp

- **Tarea:** Crear la interfaz en el portal de superadministrador para guardar las credenciales de la API de WhatsApp (las que se asocian al "tenant propietario").
- **Estado:** Pospuesto, ya que la UI reside en otro proyecto.
