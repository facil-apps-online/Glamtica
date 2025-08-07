# Refactorización del Módulo de Servicios

## Objetivo Principal
Replicar la funcionalidad y estructura del módulo de productos para el módulo de servicios, incluyendo la gestión de servicios maestros, servicios por sucursal, categorías, comisiones e impuestos. Se incluirá un nuevo tab de "Servicios" en la configuración de la sucursal, funcionando de manera análoga al tab de "Productos". El comportamiento de los impuestos para servicios será idéntico al de productos.

## Consideraciones Clave
*   Todas las operaciones CRUD para servicios (maestros, por sucursal, categorías, comisiones, impuestos) se implementarán como `tenant-actions` (edge functions).
*   Se mantendrá la distinción entre "servicios maestros/por sucursal" y "productos asociados a un servicio" (ej. un champú usado en un corte de pelo).

## Plan Detallado

### Fase 1: Preparación y Creación de Entidades Base

*   **1.1. Definir Interfaces de Servicio:** **COMPLETADO**
    *   Crear `src/types/services.ts` para definir las interfaces `MasterService` y `BranchService`, siguiendo la estructura de `MasterProduct` y `BranchProduct`.
    *   Revisar y, si es necesario, ajustar las interfaces `ServiceCategory` y `ServiceCommission` para asegurar consistencia.
    *   Definir la interfaz `ServiceTaxType` similar a `ProductTaxType`.

*   **1.2. Crear `useServices.ts` (Hook Principal):** **COMPLETADO**
    *   Desarrollar `src/hooks/useServices.ts` que contendrá la lógica para:
        *   `useMasterServices`: Obtener todos los servicios maestros.
        *   `useBranchServices`: Obtener servicios asignados a una sucursal.
        *   `useServiceBranchPrices`: Obtener precios de un servicio maestro en todas sus sucursales (si aplica, similar a productos).
        *   `useCreateMasterService`: Crear un servicio maestro.
        *   `useUpdateMasterService`: Actualizar un servicio maestro.
        *   `useAssignServiceToBranch`: Asignar un servicio a una sucursal.
        *   `useUpdateBranchService`: Actualizar un servicio en una sucursal (precio, duración, etc.).
        *   `useRemoveServiceFromBranch`: Desvincular un servicio de una sucursal.

*   **1.3. Crear `useServiceTaxTypes.ts`:** **COMPLETADO**
    *   Desarrollar `src/hooks/useServiceTaxTypes.ts` con la lógica CRUD para asociar tipos de impuestos a servicios, similar a `useProductTaxTypes.ts`.

### Fase 2: Desarrollo de Componentes de UI y Lógica de Negocio

*   **2.1. `MasterServiceDialog.tsx`:** **COMPLETADO**
    *   Crear `src/components/MasterServiceDialog.tsx` para la creación y edición de servicios maestros.
    *   Integrar la gestión de `ServiceTaxType` dentro de este diálogo, similar a cómo `MasterProductDialog` maneja `ProductTaxType`.
    *   Utilizar `useCreateMasterService`, `useUpdateMasterService`, `useServiceCategories`, y los nuevos hooks de impuestos.

*   **2.2. `AddServicesToBranchDialog.tsx`:** **COMPLETADO**
    *   Crear `src/components/AddServicesToBranchDialog.tsx` para añadir servicios maestros a una sucursal, similar a `AddProductsToBranchDialog.tsx`.
    *   Utilizar `useMasterServices` y `useAssignServiceToBranch`.

*   **2.3. `ManageServiceInBranchDialog.tsx`:** **COMPLETADO**
    *   Crear `src/components/ManageServiceInBranchDialog.tsx` para gestionar un servicio específico dentro de una sucursal (precio, duración, etc.), similar a `ManageProductInBranchDialog.tsx`.
    *   Utilizar `useBranchServices`, `useUpdateBranchService`, `useRemoveServiceFromBranch`.

*   **2.4. `BranchServicesTabContent.tsx` (CRÍTICO - Requisito del usuario):** **COMPLETADO**
    *   Crear `src/components/BranchServicesTabContent.tsx`.
    *   Este componente será el tab dentro de la configuración de la sucursal.
    *   Debe listar los `BranchService`s, permitir añadir nuevos (`AddServicesToBranchDialog`), editar existentes (`ManageServiceInBranchDialog`), y gestionar su estado (activo/inactivo).
    *   Utilizar `useBranchServices` y `useUpdateBranchService`.

*   **2.5. `ManageServicePricesDialog.tsx` (Opcional, si aplica):**
    *   Si los servicios tienen precios complejos por sucursal que requieren una gestión masiva, crear `src/components/ManageServicePricesDialog.tsx` similar a `ManageProductPricesDialog.tsx`.

*   **2.6. Integración en `BranchForm.tsx` (o componente de configuración de sucursal):** **COMPLETADO**
    *   Modificar el componente que renderiza la configuración de la sucursal (probablemente `BranchForm.tsx` o un componente similar) para añadir un nuevo tab para `BranchServicesTabContent.tsx`.

### Fase 3: Revisión y Ajustes

*   **3.1. Revisar `useServiceProducts.ts` y `AddServiceProductDialog.tsx`:** **COMPLETADO**
    *   Asegurarse de que estos componentes sigan siendo coherentes con la nueva estructura.
*   **3.2. Actualizar `DB_SCHEMA.md`:** **COMPLETADO**
    *   Documentar cualquier cambio en el esquema de la base de datos necesario para soportar las nuevas entidades de servicio y sus relaciones (ej. tablas `master_services`, `branch_services`, `service_tax_types`).
*   **3.3. Pruebas:**
    *   Realizar pruebas exhaustivas de la nueva funcionalidad.
