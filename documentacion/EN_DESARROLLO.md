# Hito: Inventario y Ventas con Decimales

**Objetivo:** Modificar el sistema para permitir el control de inventario, ventas y combos con cantidades decimales, utilizando unidades de medida parametrizables por tenant.

---

### **Fase 1: Modificaciones en la Base de Datos**

**Estado:** ✅ **Completada**

**Tareas:**

- [x] **1.1.** Crear la tabla `units_of_measure` con soporte para tenants.
- [x] **1.2.** Modificar la tabla `products` para añadir campos de unidad de medida y venta decimal.
- [x] **1.3.** Alterar las tablas de inventario, combos y transferencias para que las columnas de cantidad acepten decimales.
- [x] **1.4.** Generar y guardar los archivos de migración SQL.
- [x] **1.5.** Actualizar el archivo `timestamps.md`.

---

### **Fase 2: Adaptación de la Lógica de Negocio (Backend/API)**

**Estado:** ✅ **Completada**

**Tareas:**
- [x] **2.1.** Crear funciones RPC en la base de datos para el CRUD de `units_of_measure`.
- [x] **2.2.** Integrar las funciones RPC en la Edge Function `tenant-actions`.

---

### **Fase 3: Implementación en la Interfaz de Usuario (Frontend)**

**Estado:** ⏳ **En Progreso**

**Tareas:**
- [x] **3.1.** Crear CRUD completo para Unidades de Medida (`UnitOfMeasureManagementDialog`, `UnitOfMeasureDialog`).
- [x] **3.2.** Integrar la gestión de UoM en la página del Catálogo de Productos.
- [x] **3.3.** Modificar `MasterProductDialog` para asignar UoM y configurar venta decimal.
- [x] **3.4.** Modificar `ComboDialog` para permitir cantidades decimales y validar según la configuración del producto.
- [ ] **3.5.** Adaptar el formulario de Ventas (`AttentionForm.tsx`) para aceptar cantidades decimales.
- [ ] **3.6.** Adaptar las vistas de Inventario y Transferencias para mostrar los valores decimales.

---
