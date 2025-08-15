# Plan de Desarrollo: Módulos de Compras y Traslados

Este documento describe el plan de trabajo para refactorizar y expandir las funcionalidades de Compras y Traslados a módulos de gestión dedicados.

---

### **Fase 1: Arquitectura Base y Navegación**

*   **Estado:** `[✓] Completado`
*   **Objetivo:** Crear las nuevas páginas vacías y la navegación para acceder a ellas, reemplazando los botones de diálogo actuales y sentando las bases para los nuevos módulos.
*   **Punto de Discusión Pre-Fase:**
    *   Confirmar las rutas exactas (ej. `/inventory/purchases`).
    *   Validar el texto y la ubicación de los nuevos botones de navegación.
*   **Tareas:**
    *   `[ ]` **1.1:** Crear archivos de página: `src/pages/inventory/PurchasesPage.tsx` y `src/pages/inventory/TransfersPage.tsx`.
    *   `[ ]` **1.2:** Configurar las rutas en el enrutador de la aplicación para las nuevas páginas.
    *   `[ ]` **1.3:** Modificar el componente del módulo de inventario para reemplazar los botones de diálogo por enlaces a las nuevas páginas ("Compras" y "Traslados").
    *   `[ ]` **1.4:** Añadir botones para crear nuevas compras/traslados dentro de las páginas nuevas, que reutilizarán los diálogos existentes (`PurchaseDialog.tsx`, `ProductTransferDialog.tsx`).

---

### **Fase 2: Módulo de Gestión de Compras**

*   **Estado:** `[✓] Completado`
*   **Objetivo:** Construir una interfaz completa para administrar el ciclo de vida de las compras.
*   **Punto de Discusión Pre-Fase:**
    *   **Recepción de Mercancía:** Definir el flujo para manejar discrepancias (faltantes/sobrantes) al recibir un pedido. ¿Se genera un backorder? ¿Se ajusta la compra original?
    *   **Estados de Pago:** Detallar los estados de pago requeridos (ej. `no_pagado`, `pago_parcial`, `pagado`).
    *   **Acciones:** Confirmar todas las acciones posibles sobre una compra (Completar, Cancelar, Pagar, etc.).
*   **Tareas:**
    *   `[✓]` **2.1:** Corregir la carga de detalles en el diálogo de recepción de compras.
    *   `[✓]` **2.2:** Implementar la visualización de detalles de una recepción completada.
    *   `[✓]` **2.3:** Crear la infraestructura de backend para registrar los detalles de la recepción (`purchase_item_receptions` y funciones RPC).
    *   `[✓]` **2.4:** Implementar la lógica de negocio para ajustar el pago de compras con discrepancias.
    *   `[✓]` **2.5:** Centralizar las acciones de pago en el diálogo de detalles, simplificando la interfaz principal.

---

### **Fase 3: Módulo de Gestión de Traslados (Ampliado)**

*   **Estado:** `[✓] Completado`
*   **Objetivo:** Construir una interfaz completa para administrar el ciclo de vida de los traslados entre sucursales, incluyendo solicitudes, aprobaciones, recepciones con discrepancias y aplicación del método de costeo.
*   **Punto de Discusión Pre-Fase:**
    *   **Proceso de Aprobación/Confirmación:** Se define un flujo donde una sucursal de destino solicita productos a una sucursal de origen. La de origen puede **aprobar la solicitud (completa o con ajustes en las cantidades)**, o **rechazarla**. La de destino confirma la recepción ítem por ítem.
    *   **Manejo de Discrepancias:** Al recibir, si hay faltantes/sobrantes, se ajustará el stock de ambas sucursales y se registrará la incidencia. El costo del producto se transferirá y recalculará en el destino según el método de costeo del tenant.
    *   **Estados:** `solicitado`, `aprobado`, `rechazado`, `en_transito`, `recibido_con_incidencias`, `completado`, `cancelado`.
    *   **Costeo:** El costo de los productos se transferirá desde la sucursal de origen. La sucursal de destino recalculará el costo de sus productos existentes basándose en el método de costeo definido para el tenant (Promedio Ponderado o Último Costo).

*   **Tareas:**

    *   **3.1: Backend - Ampliar Tablas y Lógica de Traslados:**
        *   `[✓]` **3.1.1:** Modificar la tabla `product_transfers` para reflejar el nuevo flujo (solicitud/aprobación) y añadir nuevos estados.
        *   `[✓]` **3.1.2:** Crear la tabla `product_transfer_receptions` para registrar las recepciones detalladas.
        *   `[✓]` **3.1.3:** Crear la tabla `product_transfer_reception_items` para los detalles de cada producto en la recepción.
        *   `[✓]` **3.1.4:** Crear/Modificar las funciones RPC de Supabase para:
            *   `create_product_transfer_request`: Para solicitar un traslado.
            *   `approve_product_transfer`: Para aprobar una solicitud, **permitiendo ajustar las cantidades de los productos a enviar.**
            *   `reject_product_transfer`: Para rechazar una solicitud.
            *   `ship_product_transfer`: Para marcar un traslado como "en tránsito".
            *   `receive_product_transfer`: Para recibir los productos, manejar discrepancias y ajustar stock y costos.
            *   `cancel_product_transfer`: Para cancelar un traslado.

    *   **3.2: Frontend - Componentes de Traslados:**
        *   `[✓]` **3.2.1:** Crear el componente `TransfersTable.tsx` para listar los traslados.
        *   `[✓]` **3.2.2:** Crear el diálogo `ProductTransferRequestDialog.tsx` para solicitar un traslado.
        *   `[✓]` **3.2.3:** Crear el diálogo `ApproveTransferDialog.tsx` para que la sucursal de origen apruebe (con o sin ajustes) o rechace una solicitud.
        *   `[✓]` **3.2.4:** Crear el diálogo `ReceiveTransferDialog.tsx` para la recepción de productos.
        *   `[✓]` **3.2.5:** Crear el diálogo `ViewTransferReceptionDetailsDialog.tsx` para ver los detalles de una recepción.

    *   **3.3: Integración y Flujo Completo:**
        *   `[✓]` **3.3.1:** Crear la página `TransfersPage.tsx` que una la tabla y los diálogos.
        *   `[✓]` **3.3.2:** Implementar la lógica de UI para el flujo completo (solicitar, aprobar, recibir, etc.).
        *   `[✓]` **3.3.3:** Añadir filtros a la tabla (por sucursal, estado).
