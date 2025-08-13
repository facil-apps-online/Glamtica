# Proyecto: Gestión Avanzada de Comisiones

Este documento describe el plan de trabajo para implementar la funcionalidad completa de gestión de comisiones.

---

### **Fase 1: El Núcleo de Datos - Creación de Hooks Centralizados**

*   **Estado:** `[✓ Completado]`
*   **Objetivo:** Crear los hooks de datos que nos permitirán consultar y modificar las comisiones de forma centralizada. Esta es la base para que las 3 interfaces (Catálogo, Sucursal y Equipo) funcionen de manera consistente.
*   **Tareas:**
        *   `[✓ Completado]` **1.1:** Diseñar y crear `useProductCommissionData(productId)`: Un hook que, para un producto maestro, devuelva todos los usuarios, las sucursales donde está activo y sus comisiones.
    *   `[✓ Completado]` **1.2:** Diseñar y crear `useServiceCommissionData(serviceId)`: Equivalente al anterior, pero para servicios.
    *   `[✓ Completado]` **1.3:** Diseñar y crear `useUserCommissionData(userId)`: Un hook que, para un usuario, devuelva todos los productos/servicios que puede realizar/vender y sus comisiones en cada sucursal relevante.
    *   `[✓ Completado]` **1.4:** Diseñar y crear `useUpdateCommission`: Un hook de mutación para guardar los cambios de comisión.
    *   `[✓ Completado]` **1.5:** Diseñar y crear `useBranchCommissionData(branchId)`: Un hook que, para una sucursal, devuelva todos los productos/servicios activos y sus comisiones en esa sucursal.

---

### **Fase 2: Implementación UI - Gestión desde Catálogos Maestros**

*   **Estado:** `[✓ Completado]`
*   **Objetivo:** Conectar la lógica de datos al botón "Gestionar Comisiones" que ya existe en las listas de Productos y Servicios.
*   **Tareas:**
    *   `[✓ Completado]` **2.1:** Crear un nuevo diálogo `ManageProductCommissionsDialog` que usará el hook `useProductCommissionData`.
    *   `[✓ Completado]` **2.2:** Crear un diálogo análogo `ManageServiceCommissionsDialog` para los servicios.

---

### **Fase 3: Implementación UI - Gestión desde Miembro del Equipo**

*   **Estado:** `[✓ Completado]`
*   **Objetivo:** Rediseñar el diálogo de comisiones del perfil de usuario para que se ajuste a la nueva lógica de matriz.
*   **Tareas:**
    *   `[✓ Completado]` **3.1:** Modificar `UserCommissionsDialog` para que use el hook `useUserCommissionData` y muestre la nueva interfaz de matriz.

---

### **Fase 4: Implementación UI - Gestión desde Configuración de Sucursales**

*   **Estado:** `[✓ Completado]`
*   **Tareas:**
    *   `[✓ Completado]` **4.1:** Crear un nuevo componente/pestaña en la página de configuración de sucursales para gestionar comisiones.

---

# Proyecto: Gestión de Inventario Avanzada

Este documento describe el plan de trabajo para implementar las funcionalidades de Compras y Traslados de Productos.

### **Fase 1: Módulo de Compras de Productos**

*   **Estado:** `[ ] Pendiente`
*   **Objetivo:** Registrar las compras a proveedores, actualizar automáticamente el stock de la sucursal correspondiente y ajustar el costo del producto según la configuración del sistema.

**1.1. Base de Datos:**
*   **Tareas:**
    *   `[✓]` **1.1.1:** Crear migración para **eliminar** las tablas `purchases` y `purchase_items` existentes.
    *   `[✓]` **1.1.2:** Crear migración para la nueva tabla `purchases`.
    *   `[✓]` **1.1.3:** Crear migración para la nueva tabla `purchase_items`.
    *   `[✓]` **1.1.4:** Crear migración para añadir la columna `cost_price` a la tabla `branch_products`.
    *   `[✓]` **1.1.5:** Analizar `branch_products` y `products` para asegurar que existen las columnas de `stock` y `cost_price`.
    *   `[✓]` **1.1.6:** Investigar `tenant_settings` para la configuración de cálculo de costos.

**1.2. Lógica de Backend (Supabase Functions):**
*   **Tareas:**
    *   `[✓]` **1.2.1:** Crear RPC `create_purchase` que inserte en `purchases` y `purchase_items`.
    *   `[✓]` **1.2.2:** El RPC debe actualizar el stock en `branch_products`.
    *   `[✓]` **1.2.3:** El RPC debe actualizar el `cost_price` en `branch_products` según la configuración del tenant.

**1.3. Interfaz de Usuario (Frontend):**
*   **Tareas:**
    *   `[✓]` **1.3.1:** Crear página `src/pages/Inventory/Purchases.tsx` para listar las compras.
    *   `[✓]` **1.3.2:** Crear componente `PurchaseDialog.tsx` para registrar una nueva compra.
    *   `[✓]` **1.3.3:** Crear hook `usePurchases.ts`.
    *   `[✓]` **1.3.4:** Crear hook `useCreatePurchase.ts`.

---

### **Fase 2: Módulo de Traslados de Productos**

*   **Estado:** `[ ] Pendiente`
*   **Objetivo:** Permitir mover productos de una sucursal a otra, reflejando los cambios de stock en ambas.

**2.1. Base de Datos:**
*   **Tareas:**
    *   `[ ]` **2.1.1:** Crear migración para la tabla `product_transfers`:
        *   `id` (UUID, PK)
        *   `tenant_id` (UUID, FK a `tenants`)
        *   `from_branch_id` (UUID, FK a `branches`)
        *   `to_branch_id` (UUID, FK a `branches`)
        *   `transfer_date` (TIMESTAMPTZ)
        *   `status` (TEXT, ej: 'en_proceso', 'en_transito', 'completado', 'cancelado')
        *   `notes` (TEXT, opcional)
    *   `[ ]` **2.1.2:** Crear migración para la tabla `product_transfer_items`:
        *   `id` (UUID, PK)
        *   `transfer_id` (UUID, FK a `product_transfers`)
        *   `product_id` (UUID, FK a `products`)
        *   `quantity` (INTEGER)

**2.2. Lógica de Backend (Supabase Functions):**
*   **Tareas:**
    *   `[ ]` **2.2.1:** Crear RPC `create_product_transfer`.
    *   `[ ]` **2.2.2:** El RPC debe descontar el stock de la sucursal de origen.
    *   `[ ]` **2.2.3:** Crear RPC `update_product_transfer_status`.
    *   `[ ]` **2.2.4:** El RPC de actualización de estado debe incrementar el stock en la sucursal de destino al completarse.

**2.3. Interfaz de Usuario (Frontend):**
*   **Tareas:**
    *   `[ ]` **2.3.1:** Crear página `src/pages/Inventory/Transfers.tsx`.
    *   `[ ]` **2.3.2:** Crear componente `ProductTransferDialog.tsx`.
    *   `[ ]` **2.3.3:** Crear hook `useProductTransfers.ts`.
    *   `[ ]` **2.3.4:** Crear hook `useCreateProductTransfer.ts`.
    *   `[ ]` **2.2.5:** Crear hook `useUpdateProductTransferStatus.ts`.