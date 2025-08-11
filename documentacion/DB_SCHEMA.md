# Esquema de Base de Datos (DB_SCHEMA.md)

Este documento describe el esquema de la base de datos, incluyendo tablas, relaciones y funciones RPC (Remote Procedure Call) utilizadas en el sistema.

---

## Tablas

### `master_services`

Representa el catálogo general de servicios ofrecidos.

| Columna          | Tipo de Dato | Restricciones | Descripción                                   |
| :--------------- | :----------- | :------------ | :-------------------------------------------- |
| `id`             | `UUID`       | `PK`          | Identificador único del servicio maestro.     |
| `name`           | `TEXT`       | `NOT NULL`    | Nombre del servicio.                          |
| `description`    | `TEXT`       | `NULLABLE`    | Descripción detallada del servicio.           |
| `duration_minutes` | `INTEGER`    | `NULLABLE`    | Duración estimada del servicio en minutos.    |
| `cost_price`     | `NUMERIC`    | `NULLABLE`    | Costo interno del servicio (para la empresa). |
| `is_active`      | `BOOLEAN`    | `DEFAULT TRUE`| Indica si el servicio maestro está activo.    |
| `category`       | `TEXT`       | `NULLABLE`    | Categoría a la que pertenece el servicio.     |
| `tenant_id`      | `UUID`       | `FK`          | ID del inquilino al que pertenece el servicio. |
| `created_at`     | `TIMESTAMPTZ`| `DEFAULT NOW()`| Fecha y hora de creación.                     |
| `updated_at`     | `TIMESTAMPTZ`| `DEFAULT NOW()`| Última fecha y hora de actualización.         |

### `branch_services`

Representa la asignación y configuración específica de un servicio maestro a una sucursal.

| Columna            | Tipo de Dato | Restricciones | Descripción                                           |
| :----------------- | :----------- | :------------ | :---------------------------------------------------- |
| `branch_service_id`| `UUID`       | `PK`          | Identificador único de la asignación de servicio a sucursal. |
| `service_id`       | `UUID`       | `FK`          | ID del servicio maestro (`master_services.id`).       |
| `branch_id`        | `UUID`       | `FK`          | ID de la sucursal (`branches.id`).                    |
| `selling_price`    | `NUMERIC`    | `NOT NULL`    | Precio de venta del servicio en esta sucursal.        |
| `is_branch_active` | `BOOLEAN`    | `DEFAULT TRUE`| Indica si el servicio está activo en esta sucursal.   |
| `tenant_id`        | `UUID`       | `FK`          | ID del inquilino.                                     |
| `created_at`       | `TIMESTAMPTZ`| `DEFAULT NOW()`| Fecha y hora de creación.                             |
| `updated_at`       | `TIMESTAMPTZ`| `DEFAULT NOW()`| Última fecha y hora de actualización.                 |

### `service_categories`

Categorías para organizar los servicios.

| Columna          | Tipo de Dato | Restricciones | Descripción                                   |
| :--------------- | :----------- | :------------ | :-------------------------------------------- |
| `id`             | `UUID`       | `PK`          | Identificador único de la categoría.          |
| `name`           | `TEXT`       | `NOT NULL`    | Nombre de la categoría.                       |
| `description`    | `TEXT`       | `NULLABLE`    | Descripción de la categoría.                  |
| `is_active`      | `BOOLEAN`    | `DEFAULT TRUE`| Indica si la categoría está activa.           |
| `tenant_id`      | `UUID`       | `FK`          | ID del inquilino.                             |
| `created_at`     | `TIMESTAMPTZ`| `DEFAULT NOW()`| Fecha y hora de creación.                     |
| `updated_at`     | `TIMESTAMPTZ`| `DEFAULT NOW()`| Última fecha y hora de actualización.         |

### `service_tax_types`

Asociación de tipos de impuestos a servicios.

| Columna          | Tipo de Dato | Restricciones | Descripción                                   |
| :--------------- | :----------- | :------------ | :-------------------------------------------- |
| `id`             | `UUID`       | `PK`          | Identificador único de la asociación.         |
| `service_id`     | `UUID`       | `FK`          | ID del servicio (`master_services.id`).       |
| `tax_type_id`    | `UUID`       | `FK`          | ID del tipo de impuesto (`tax_types.id`).     |
| `tenant_id`      | `UUID`       | `FK`          | ID del inquilino.                             |
| `created_at`     | `TIMESTAMPTZ`| `DEFAULT NOW()`| Fecha y hora de creación.                     |
| `updated_at`     | `TIMESTAMPTZ`| `DEFAULT NOW()`| Última fecha y hora de actualización.         |

### `service_user_commissions`

Comisiones específicas para usuarios por servicio.

| Columna          | Tipo de Dato | Restricciones | Descripción                                   |
| :--------------- | :----------- | :------------ | :-------------------------------------------- |
| `id`             | `UUID`       | `PK`          | Identificador único de la comisión.           |
| `service_id`     | `UUID`       | `FK`          | ID del servicio (`master_services.id`).       |
| `user_id`        | `UUID`       | `FK`          | ID del usuario (`users.id`).                  |
| `branch_id`      | `UUID`       | `FK`          | ID de la sucursal (`branches.id`).            |
| `commission_rate`| `NUMERIC`    | `NOT NULL`    | Tasa de comisión (porcentaje o monto fijo).   |
| `is_percentage`  | `BOOLEAN`    | `NOT NULL`    | Indica si la comisión es un porcentaje.       |
| `tenant_id`      | `UUID`       | `FK`          | ID del inquilino.                             |
| `created_at`     | `TIMESTAMPTZ`| `DEFAULT NOW()`| Fecha y hora de creación.                     |
| `updated_at`     | `TIMESTAMPTZ`| `DEFAULT NOW()`| Última fecha y hora de actualización.         |

---

## Funciones RPC (tenant-actions)

Las siguientes funciones RPC se expondrán a través de `tenant-actions` para interactuar con las nuevas tablas de servicios.

### Servicios Maestros (`master_services`)

*   **`get_master_services`**: Recupera todos los servicios maestros.
*   **`create_master_service`**: Crea un nuevo servicio maestro.
    *   `payload`: `{ serviceData: Omit<MasterService, 'id' | 'tenant_id' | 'created_at' | 'updated_at'> }`
*   **`update_master_service`**: Actualiza un servicio maestro existente.
    *   `payload`: `{ id: string; updates: Partial<MasterService> }`
*   **`delete_master_service`**: Elimina un servicio maestro.
    *   `payload`: `{ id: string }`
*   **`toggle_master_service_status`**: Cambia el estado activo de un servicio maestro.
    *   `payload`: `{ id: string; is_active: boolean }`

### Servicios por Sucursal (`branch_services`)

*   **`get_branch_services`**: Recupera los servicios asignados a una sucursal específica.
    *   `payload`: `{ branchId: string }`
*   **`assign_service_to_branch`**: Asigna uno o varios servicios maestros a una o varias sucursales.
    *   `payload`: `{ service_id: string; branch_ids: string[]; defaults: { selling_price: number; duration_minutes?: number; is_active?: boolean } }`
*   **`update_branch_service`**: Actualiza la configuración de un servicio en una sucursal.
    *   `payload`: `{ id: string; updates: Partial<Omit<BranchService, 'id'>> }`
*   **`remove_service_from_branch`**: Desvincula un servicio de una sucursal.
    *   `payload`: `{ branch_service_id: string }`
*   **`get_service_branch_prices`**: Recupera los precios de un servicio maestro en todas sus sucursales asignadas.
    *   `payload`: `{ serviceId: string }`

### Categorías de Servicio (`service_categories`)

*   **`get_service_categories`**: Recupera todas las categorías de servicio.
*   **`create_service_category`**: Crea una nueva categoría de servicio.
    *   `payload`: `{ categoryData: Omit<ServiceCategory, 'id' | 'created_at' | 'updated_at'> }`
*   **`update_service_category`**: Actualiza una categoría de servicio existente.
    *   `payload`: `{ id: string; updates: Partial<ServiceCategory> }`
*   **`delete_service_category`**: Elimina una categoría de servicio.
    *   `payload`: `{ id: string }`
*   **`toggle_service_category_status`**: Cambia el estado activo de una categoría de servicio.
    *   `payload`: `{ id: string; is_active: boolean }`

### Tipos de Impuesto por Servicio (`service_tax_types`)

*   **`get_service_tax_types`**: Recupera los tipos de impuesto asociados a un servicio.
    *   `payload`: `{ service_id: string }`
*   **`add_service_tax_type`**: Asocia un tipo de impuesto a un servicio.
    *   `payload`: `{ service_id: string; tax_type_id: string }`
*   **`remove_service_tax_type`**: Desasocia un tipo de impuesto de un servicio.
    *   `payload`: `{ id: string }`

### Comisiones de Usuario por Servicio (`service_user_commissions`)

*   **`get_service_user_commissions`**: Recupera las comisiones de usuario para un servicio específico.
    *   `payload`: `{ service_id: string; branch_id?: string; user_id?: string }`
*   **`create_service_user_commission`**: Crea una nueva comisión de usuario por servicio.
    *   `payload`: `{ commissionData: Omit<ServiceUserCommission, 'id' | 'tenant_id' | 'created_at' | 'updated_at'> }`
*   **`update_service_user_commission`**: Actualiza una comisión de usuario por servicio.
    *   `payload`: `{ id: string; updates: Partial<ServiceUserCommission> }`
*   **`delete_service_user_commission`**: Elimina una comisión de usuario por servicio.
    *   `payload`: `{ id: string }`

---
