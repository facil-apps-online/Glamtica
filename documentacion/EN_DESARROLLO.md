# EN DESARROLLO: Módulo de Colaboración y Notificaciones

Este es el plan de desarrollo para la **Prioridad #1**.

---

## Fase 1.1: El Núcleo de Notificaciones (Completada)

**Objetivo:** Crear la infraestructura base para un sistema de notificaciones en tiempo real.

- **Tareas Backend:**
    - [x] **Diseño de Datos:** Definir el esquema de la tabla `notifications`.
    - [x] **API (Lectura):** Crear el endpoint `GET /api/notifications`.
    - [x] **API (Escritura):** Crear los endpoints para marcar notificaciones como leídas.
    - [x] **Servicio Interno:** Diseñar la función `createNotification`.
    - [x] **Tiempo Real:** Configurar la publicación de cambios en la tabla `notifications`.
    - [x] **Implementación Inicial:** Integrar en el flujo de creación de citas y pago de comisiones.

- **Tareas Frontend:**
    - [x] **Gestión de Estado:** Añadir el store de `notificationStore`.
    - [x] **Componente de UI (Icono):** Crear el componente `NotificationBell`.
    - [x] **Componente de UI (Dropdown):** Crear el panel `NotificationDropdown`.
    - [x] **Integración API:** Conectar los componentes a la API.
    - [x] **Integración Tiempo Real:** Implementar el listener de Supabase Realtime.

---

## Fase 1.2: El Chatter Contextual

**Objetivo:** Implementar un feed de actividad, auditoría y colaboración (el "chatter") en todos los CRUDs y vistas de configuración importantes del sistema.

**Enfoque Híbrido:** Se utilizará la tabla `audit_logs` existente para los eventos de auditoría automáticos (cambios en los datos) y se creará una nueva tabla `chatter_comments` para la colaboración manual (comentarios, tareas, etc.). El frontend unificará ambas fuentes de datos.

### Inventario de CRUDs y Vistas a Integrar

- **Gestión de Clientes:**
    - [x] Clientes (Prototipo completado)
- **Gestión de Ventas y Citas:**
    - [ ] Atenciones/Citas
    - [ ] Ventas (POS)
- **Catálogo y Precios:**
    - [ ] Productos (Maestro)
    - **Servicios (Maestro):**
    - [x] **Investigación de Auditoría:** Se detectó que los logs de auditoría para la tabla `services` no se estaban generando.
    - [x] **Análisis de Causa Raíz:** Se investigó el historial de migraciones y se descubrió que el trigger de auditoría (`audit_services_changes`) fue eliminado intencionadamente en el pasado (`20250802000046_drop_audit_services_trigger.sql`) debido a una refactorización que eliminó la columna `branch_id` de la tabla `services`, lo que rompía la función de auditoría genérica.
    - [x] **Solución Implementada:**
        - Se creó una nueva función de base de datos específica: `public.audit_master_services_function()`.
        - Esta función está diseñada para la tabla `services`, obteniendo el `tenant_id` pero pasando `NULL` para el `branch_id` que ya no existe.
        - Se creó una nueva migración (`20251014000001_reintroduce_audit_on_services_table.sql`) para implementar la nueva función y un nuevo trigger (`audit_services_master_changes`) en la tabla `services`.
        - [x] **Corrección (Bug Fix):** Se creó una migración adicional (`20251014000002_fix_audit_master_services_function_cast.sql`) para corregir un error de tipo en la función de auditoría, asegurando que el valor `NULL` para `branch_id` se interprete correctamente como `uuid`.
        - [x] **Corrección Definitiva:** Se creó una tercera migración (`20251014000003_definitive_fix_for_audit_master_services_function.sql`) después de descubrir que la firma de la función `log_audit_action` había cambiado. La nueva función ahora captura y pasa el `user_id` y ajusta todos los tipos de datos para alinearse con la última versión del sistema de auditoría.
    - [x] **Estado:** La auditoría para la tabla maestra de servicios ha sido restaurada y ahora funciona correctamente.
    - [ ] Combos (Maestro)
    - [ ] Categorías (Productos y Servicios)
    - [ ] Marcas de Productos
    - [ ] Impuestos
- **Gestión de Inventario y Proveedores:**
    - [ ] Proveedores
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

### Plan de Implementación (Prototipo en "Clientes")

1.  **Diseño de Base de Datos:**
    - [x] Crear una tabla `chatter_comments` para almacenar los mensajes manuales de los usuarios.
    - [x] Analizar la tabla `audit_logs` para asegurar que se pueda consultar eficientemente.
2.  **Backend (API):**
    - [x] Modificar la acción `get_chatter_events` para que lea de `audit_logs` y `chatter_comments` y combine los resultados.
    - [x] Crear una acción para añadir un nuevo comentario a `chatter_comments` (`create_chatter_comment`).
    - [x] Verificar que los `triggers` de auditoría estén correctamente implementados para los cambios en Clientes.
3.  **Frontend (UI):**
    - [x] Crear un componente reutilizable `ChatterBox.tsx`.
    - [x] Integrar este componente en la vista de edición o detalle de un Cliente.

---

## Fase 1.3: El Chat Interno (Pendiente)

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