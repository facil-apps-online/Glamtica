# Plan de Refactorización: Módulos de Ventas, Inventario y Numeración

## Objetivo

Re-arquitecturizar el sistema de registro de transacciones para desacoplar el concepto de "Venta" del de "Factura", establecer un sistema de control de inventario robusto basado en movimientos, y crear un sistema de numeración de documentos flexible y configurable por el tenant.

---

## Fase 1: Diseño y Creación de Esquema de Base de Datos

Esta fase establece la nueva estructura fundamental en la base de datos. Se crearán todas las tablas necesarias a través de migraciones de Supabase.

### Tarea 1.1: Crear Tabla `product_movements`

Esta tabla será la única fuente de verdad para cualquier cambio en el stock de un producto, permitiendo auditorías completas y reconstrucción del stock a cualquier fecha.

**Estructura Propuesta:**
```sql
CREATE TABLE public.product_movements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    branch_id uuid NOT NULL REFERENCES branches(id),
    product_id uuid NOT NULL REFERENCES products(id),
    movement_date timestamptz NOT NULL DEFAULT now(),
    movement_type text NOT NULL, -- 'SALE', 'PURCHASE', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT'
    quantity_change numeric NOT NULL,
    cost_of_change numeric NOT NULL,
    stock_after_movement numeric NOT NULL,
    cost_after_movement numeric NOT NULL, -- Costo promedio ponderado
    reference_id uuid,
    reference_type text,
    created_at timestamptz NOT NULL DEFAULT now()
);
```

### Tarea 1.2: Crear Tabla `document_sequences`

Gestionará de forma centralizada y segura la numeración de todos los documentos del sistema, con flexibilidad para normativas locales.

**Estructura Propuesta:**
```sql
CREATE TABLE public.document_sequences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    branch_id uuid REFERENCES branches(id), -- Nulo si es para todo el tenant
    name text NOT NULL,
    document_type text NOT NULL, -- 'SALE', 'INVOICE', 'CREDIT_NOTE', 'TRANSFER'
    prefix text,
    current_number integer NOT NULL DEFAULT 1,
    padding integer NOT NULL DEFAULT 7, -- Ceros a la izquierda
    is_active boolean NOT NULL DEFAULT true,
    country_specific_data jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);
```

### Tarea 1.3: Crear Tablas `sales` y `sales_items`

Serán el nuevo corazón del registro de transacciones, separadas de la lógica de facturación electrónica.

**Estructura Propuesta para `sales`:**
```sql
CREATE TABLE public.sales (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    branch_id uuid NOT NULL REFERENCES branches(id),
    client_id uuid REFERENCES clients(id),
    attention_id uuid REFERENCES attentions(id),
    sale_number text NOT NULL,
    sale_date timestamptz NOT NULL DEFAULT now(),
    subtotal_amount numeric(12, 2) NOT NULL,
    total_tax_amount numeric(12, 2) NOT NULL,
    total_amount numeric(12, 2) NOT NULL,
    status text NOT NULL DEFAULT 'COMPLETED', -- 'COMPLETED', 'RETURNED', 'CANCELLED'
    created_at timestamptz NOT NULL DEFAULT now()
);
```

**Estructura Propuesta para `sales_items`:**
```sql
CREATE TABLE public.sales_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    parent_item_id uuid REFERENCES sales_items(id) ON DELETE CASCADE, -- Para jerarquía de combos
    item_type text NOT NULL, -- 'PRODUCT', 'SERVICE', 'COMBO'
    product_id uuid REFERENCES products(id),
    service_id uuid REFERENCES services(id),
    description text NOT NULL,
    quantity numeric NOT NULL,
    unit_price numeric(12, 2) NOT NULL,
    subtotal_price numeric(12, 2) NOT NULL,
    tax_details jsonb, -- [{"name": "IVA", "rate": 0.19, "amount": 19.00}]
    total_tax_amount numeric(12, 2) NOT NULL,
    total_price numeric(12, 2) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
```

---

## Fase 2: Implementación de Lógica de Backend (RPCs)

Con las tablas ya creadas, se desarrollará la lógica de negocio en funciones de base de datos para garantizar la atomicidad y consistencia de los datos.

### Tarea 2.1: Crear Función `get_next_document_number`
*   **Propósito:** Obtener el siguiente número para un tipo de documento de forma segura, evitando duplicados (race conditions) mediante el bloqueo de fila (`SELECT FOR UPDATE`).
*   **Entrada:** `p_document_type text`, `p_branch_id uuid` (opcional).
*   **Salida:** El número de documento formateado (ej: `FE-0000001`).

### Tarea 2.2: Crear Función `create_product_movement`
*   **Propósito:** Centralizar la creación de registros en la tabla `product_movements`. Será llamada por otras funciones (ventas, compras, etc.).
*   **Entrada:** Todos los datos necesarios para un registro de movimiento.
*   **Lógica:** Inserta el registro y actualiza el stock en la tabla `branch_products` para consistencia.

### Tarea 2.3: Refactorizar `generate_invoice_for_attention` a `process_sale_from_attention`
*   **Propósito:** Será la función principal que se ejecute después de un pago. Orquestará todo el proceso de registro de la venta.
*   **Lógica Principal:**
    1.  Leer la configuración de facturación del tenant.
    2.  Llamar a `get_next_document_number('SALE')` para obtener el número de venta.
    3.  Crear el registro en la tabla `sales`.
    4.  Recorrer los items de la atención y, respetando la configuración del tenant, crear la lista de `sales_items` con su jerarquía de combos y cálculo de impuestos por línea.
    5.  Insertar todos los `sales_items`.
    6.  Por cada producto en `sales_items`, llamar a `create_product_movement` para registrar la salida del inventario.
    7.  Devolver el `id` de la nueva venta.

---

## Fase 3: Integración y Frontend

Ajustes finales para conectar la nueva lógica de backend con la interfaz de usuario.

### Tarea 3.1: Modificar Edge Function `tenant-actions`
*   El `case 'process_attention_payment'` deberá ser modificado para llamar a la nueva RPC `process_sale_from_attention` en lugar de la antigua.

### Tarea 3.2: Crear UI para Gestión de `document_sequences`
*   Desarrollar una nueva sección en la configuración del tenant para que pueda gestionar sus secuencias de numeración.

### Tarea 3.3: Construir Informes de Inventario
*   Crear las vistas de frontend para el "Informe de Stock a Fecha" y el "Kardex de Producto", consumiendo los datos de la tabla `product_movements`.

### Tarea 3.4: Ajustar el Recibo/Factura Visual
*   El componente `ReceiptDialog` deberá ser modificado para leer los datos de las tablas `sales` y `sales_items` y ser capaz de renderizar la jerarquía de combos.
