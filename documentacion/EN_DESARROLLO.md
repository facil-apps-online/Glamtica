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