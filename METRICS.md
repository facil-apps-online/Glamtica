# Implementación de Métricas de Rendimiento

Este documento describe la arquitectura, el estado actual y el proceso para implementar la recolección de métricas de rendimiento del backend en el panel de Superadministrador.

## 1. Arquitectura y Funcionamiento

El sistema de métricas se basa en un patrón de **RPC (Remote Procedure Call) con medición integrada**. El objetivo es medir el tiempo de respuesta de las operaciones críticas del backend.

El flujo de trabajo es el siguiente:

1.  **Llamada desde el Frontend:** En lugar de que el frontend consulte directamente una tabla (ej. `supabase.from('tenants').select()`), ahora llama a una función específica de la base de datos (una RPC, ej. `supabase.rpc('get_tenants_with_metrics')`).

2.  **Ejecución y Medición en el Backend:** La función RPC es responsable de dos tareas:
    *   **Realizar la Consulta:** Ejecuta la consulta SQL necesaria para obtener los datos que el frontend solicita.
    *   **Medir y Registrar:** Antes y después de la consulta, la función captura el tiempo (`clock_timestamp()`). Calcula la duración en milisegundos y la inserta como un nuevo registro en una tabla centralizada llamada `api_request_metrics`.

3.  **Visualización en el Dashboard:**
    *   Una página dedicada (`/pages/Superadmin/PerformanceMetrics.tsx`) llama a otra RPC (`get_api_health_stats`).
    *   Esta segunda RPC no obtiene datos de negocio, sino que agrega los datos de la tabla `api_request_metrics` (calcula promedios, tasas de error, etc.) y los devuelve en un formato listo para ser consumido por los gráficos.

Este patrón nos permite centralizar la lógica de medición en el backend, manteniendo el código del frontend limpio y enfocado solo en mostrar los datos.

## 2. Estado Actual

### Implementado ✅

-   **Métrica:** Rendimiento del listado de tenants.
-   **Componente Afectado:** `src/pages/Superadmin/TenantsList.tsx`
-   **Hook Modificado:** `src/hooks/useTenants.ts`
-   **RPC Creada:** `get_tenants_with_metrics(search_term_param TEXT)`
-   **Funcionamiento:** Cada vez que un superadministrador carga la lista de tenants, se registra el tiempo de respuesta de la base de datos.

### Pendiente ⏳

Para obtener una cobertura completa del rendimiento del panel, necesitamos aplicar el mismo patrón a las siguientes áreas:

-   [ ] **Detalles de un Tenant:** (`useTenantById`)
-   [ ] **Usuarios de un Tenant:** (`useTenantUsers`)
-   [ ] **Integraciones de un Tenant:** (`useTenantIntegrations`)
-   [ ] **Listado de Planes de Suscripción:** (`useSubscriptionPlans`)
-   [ ] **Gestión de Precios:** (`useCalculatedPrices`, `useAllPlanPriceHistory`)
-   [ ] **Dashboard Principal de Superadmin:** (`useSuperadminDashboardStats`) - **Prioridad Alta**
-   [ ] **Reportes de Errores:** (`useErrorReports`)
-   [ ] **Alertas del Sistema:** (`useSystemAlerts`)
-   [ ] **Configuraciones Globales:** (Varios hooks como `useCountries`, `useCurrencies`, etc.)

## 3. Proceso de Implementación (Patrón a Seguir)

Para implementar una nueva métrica, se deben seguir los siguientes 3 pasos:

### Paso 1: Crear la Tabla de Métricas (Realizado una sola vez)

-   Ya hemos creado la tabla `api_request_metrics` y la función `get_api_health_stats` que la consume. Este paso no necesita repetirse.

### Paso 2: Crear la RPC de Medición en el Backend

1.  **Identificar el Hook:** Localizar el hook de React Query (ej. `useSuperadminDashboardStats`) que actualmente realiza una consulta directa (`supabase.from(...).select()`).
2.  **Crear Archivo de Migración (DROP):** Crear un nuevo archivo de migración SQL que elimine la versión anterior de la función si existiera (para evitar conflictos).
    ```sql
    DROP FUNCTION IF EXISTS public.nombre_de_la_funcion_vieja();
    ```
3.  **Crear Archivo de Migración (CREATE):** Crear un segundo archivo de migración que defina la nueva función RPC (ej. `get_dashboard_stats_with_metrics`). Esta función debe:
    *   Definir la estructura de la tabla que va a devolver (`RETURNS TABLE (...)`).
    *   Iniciar un temporizador: `start_time := clock_timestamp();`.
    *   Realizar la consulta `SELECT` original.
    *   Detener el temporizador y calcular la duración.
    *   Insertar la métrica en la tabla `api_request_metrics`.
    *   Devolver el resultado de la consulta.
4.  **Conceder Permisos:** En el mismo archivo, añadir el comando para permitir que los usuarios ejecuten la función:
    ```sql
    GRANT EXECUTE ON FUNCTION public.nombre_de_la_nueva_funcion() TO anon;
    ```
5.  **Aplicar Migraciones:** Ejecutar `supabase db push --include-all`.

### Paso 3: Adaptar el Hook en el Frontend

1.  **Modificar el Hook:** Abrir el archivo del hook correspondiente (ej. `src/hooks/useSuperadminDashboardStats.ts`).
2.  **Actualizar la Función de Fetch:** Cambiar la lógica interna de la función `fetch...` para que llame a la nueva RPC en lugar de hacer la consulta directa.
    ```typescript
    // ANTES:
    // const { data, error } = await supabase.from('...').select('...');

    // DESPUÉS:
    const { data, error } = await supabase.rpc('nombre_de_la_nueva_funcion');
    ```
3.  **Verificar la Interfaz:** Asegurarse de que la interfaz de TypeScript que define la estructura de los datos coincida con lo que la nueva RPC devuelve.
