# Plan de Desarrollo: Módulo de Equipos

## Objetivo

Crear un módulo para gestionar equipos, como máquinas y herramientas, que requieran mantenimiento. El módulo permitirá a los usuarios rastrear la información del equipo, el programa de mantenimiento y la asignación a un usuario y sucursal. La asignación será bidireccional, permitiendo a los usuarios asignar equipos desde la página de equipos y desde la página del usuario.

## 1. Esquema de la Base de Datos

- [x] Crear tabla `equipment`
- [x] Crear tabla `equipment_types`
- [x] Crear tabla `equipment_assignments`
- [x] Crear tabla `equipment_maintenance_history`
- [x] Reforzar seguridad con `tenant_id` en tablas relacionadas.

## 2. Backend (Supabase)

- [x] Crear archivo de migración para las nuevas tablas.
- [x] Crear funciones RPC para las operaciones CRUD.
- [x] Reforzar funciones RPC con `tenant_id`.
- [x] Crear Edge Function `cron-jobs` para tareas programadas.
- [x] Implementar lógica de notificaciones de mantenimiento en `cron-jobs`.
- [x] Crear infraestructura segura para ejecutar cron jobs.
- [x] Programar el cron job de notificaciones de mantenimiento.

## 3. Frontend (React)

- [x] Crear página `src/pages/EquipmentPage.tsx`.
- [x] Crear componente `src/components/EquipmentDialog.tsx`.
- [x] Crear componente `src/components/MaintenanceHistoryDialog.tsx`.
- [x] Crear componente `src/components/AssignEquipmentDialog.tsx`.
- [x] Crear componente `src/components/EquipmentSelector.tsx`.
- [x] Crear componente `src/components/EquipmentTypeManagementDialog.tsx`.
- [x] Crear hook `src/hooks/useEquipment.ts`.
- [x] Crear hook `src/hooks/useEquipmentAssignments.ts`.
- [x] Crear hook `src/hooks/useMaintenanceHistory.ts`.
- [x] Crear hook `src/hooks/useEquipmentTypes.ts`.
- [x] Añadir ruta en `src/App.tsx`.
- [x] Añadir enlace en `src/components/AppSidebar.tsx`.
- [x] Modificar la página `Team` (`src/pages/Team.tsx`).

## 4. Interfaz de Usuario (UI)

- [x] Diseñar la tabla de equipos en `EquipmentPage`.
- [x] Diseñar el formulario en `EquipmentDialog`.
- [x] Diseñar el historial en `MaintenanceHistoryDialog`.
- [x] Diseñar el diálogo de asignación en `AssignEquipmentDialog`.
- [x] Añadir botón en la tarjeta de usuario en la página `Team`.

## 5. Conexión Frontend-Backend

- [x] **Tipos de Equipo (Equipment Types)**
  - [x] Crear migración para las funciones RPC de CRUD de `equipment_types`.
  - [x] Actualizar el hook `useEquipmentTypes` para usar las funciones RPC.
  - [x] Conectar el componente `EquipmentTypeManagementDialog` para usar el hook actualizado.
- [x] **Equipos (Equipment)**
  - [x] Actualizar el hook `useEquipment` para usar la función RPC `get_equipment`.
  - [x] Conectar el componente `EquipmentDialog` para crear y actualizar equipos usando las funciones RPC.
- [x] **Asignaciones de Equipos (Equipment Assignments)**
  - [x] Actualizar el hook `useEquipmentAssignments` para usar la función RPC `assign_equipment_to_user`.
  - [x] Conectar el componente `AssignEquipmentDialog` para usar el hook actualizado.
- [x] **Historial de Mantenimiento (Maintenance History)**
  - [x] Actualizar el hook `useMaintenanceHistory` para usar las funciones RPC `get_equipment_maintenance_history` y `create_equipment_maintenance_record`.
  - [x] Conectar el componente `MaintenanceHistoryDialog` para usar el hook actualizado.

---

# Plan de Refactorización del Módulo de Equipos

**Objetivo:** Separar la gestión completa de "Tipos de Equipo" y "Marcas" en sus propias páginas dedicadas, y dejar en el formulario de creación de equipos solo una funcionalidad de "añadido rápido" para estos dos catálogos.

---

### **Fase 1: Backend - Creación de la Entidad `equipment_brands`**

- [ ] **Migración de Base de Datos:**
    - [ ] Crear la migración para la tabla **`equipment_brands`**.
    - [ ] Campos: `id`, `name`, `description`, `tenant_id`, `is_active`, `created_at`.
- [ ] **Actualización de Edge Function (`tenant-actions`):**
    - [ ] Añadir los actions: **`create_equipment_brand`**, **`get_equipment_brands_by_tenant`**, **`update_equipment_brand`** y **`delete_equipment_brand`**.

---

### **Fase 2: Frontend - Gestión Completa de Marcas de Equipo**

- [ ] **Creación del Hook `useEquipmentBrands`:**
    - [ ] Crear el hook **`useEquipmentBrands.ts`** para comunicar con la edge function.
- [ ] **Creación de la Página de Gestión de Marcas:**
    - [ ] La nueva página se llamará **`EquipmentBrandManagementPage.tsx`**.
- [ ] **Creación del Diálogo de Gestión de Marcas:**
    - [ ] El diálogo se llamará **`EquipmentBrandDialog.tsx`**.

---

### **Fase 3: Frontend - Refactorización del Formulario de Equipos**

- [ ] **Modificación de `EquipmentDialog.tsx`:**
    - [ ] El `Select` de marcas usará el nuevo hook **`useEquipmentBrands`**.
    - [ ] El botón de "añadido rápido" abrirá el **`EquipmentBrandDialog.tsx`**.

---

### **Fase 4: Frontend - Refactorización de la Gestión de Tipos de Equipo**

- [ ] **Creación de la Página de Gestión de Tipos:** `EquipmentTypeManagementPage.tsx`.
- [ ] **Simplificación del Diálogo:** `EquipmentTypeManagementDialog.tsx` solo para creación rápida.