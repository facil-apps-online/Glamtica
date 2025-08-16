# Documentación del Portal de Superadministrador

Este documento detalla la arquitectura, componentes y funcionalidades del portal de superadministrador de Glamtica.app.

## Fase 1: Frontend

A continuación, se describe cada sección del portal, siguiendo la estructura del menú de navegación.

### 1. Dashboard (Estadísticas)

**Archivo Principal:** `src/pages/Superadmin/SuperadminStats.tsx`

#### 1.1. Propósito y Funcionalidad

Esta página es el punto de entrada principal para el superadministrador. Ofrece una vista consolidada de las métricas financieras y de crecimiento más importantes de la plataforma. Su objetivo es proporcionar una "salud" general del negocio de un solo vistazo.

Las métricas clave que se muestran son:
- **Ingresos Mensuales Recurrentes (MRR):** Ingresos predecibles que la plataforma recibe cada mes.
- **Ingresos Anuales Recurrentes (ARR):** Ingresos predecibles que la plataforma recibe cada año.
- **Nuevos Tenants (Últimos 30 días):** Número de nuevas empresas o clientes que se han unido a la plataforma.
- **Proyecciones de Ingresos:** Estimaciones de ingresos para los próximos 7 y 30 días.
- **Ingresos por Renovación:** Ingresos generados por renovaciones de suscripciones en los últimos 30 días.
- **Distribución de Planes:** Un gráfico circular que muestra la proporción de tenants en cada tipo de plan (Mensual, Semestral, Anual).

#### 1.2. Componentes Utilizados

- **`StatsCard` (`@/components/StatsCard`):** Componente reutilizable para mostrar una métrica individual con un título, un valor y un ícono. Es el bloque de construcción principal para los KPIs.
- **`Card`, `CardContent`, `CardHeader`, `CardTitle` (`@/components/ui/card`):** Componentes de la librería `shadcn/ui` para estructurar el contenido en tarjetas.
- **`ResponsiveContainer`, `PieChart`, `Pie`, `Cell`, `Tooltip`, `Legend` (`recharts`):** Componentes de la librería `recharts` para renderizar el gráfico de distribución de planes.
- **`motion`, `AnimatePresence` (`framer-motion`):** Se utilizan para añadir animaciones sutiles de entrada y transición, mejorando la experiencia de usuario al cargar los datos o al mostrar estados de error.

#### 1.3. Hooks y Lógica de Datos

- **`useFinancialStats` (`@/hooks/useFinancialStats`):** Este es el hook principal que alimenta toda la página. Se encarga de llamar a la función RPC `get_superadmin_financial_stats` de Supabase para obtener todas las métricas financieras. Gestiona los estados de carga (`isLoading`), error (`isError`) y los datos (`stats`).

#### 1.4. Diseño y UX (Escritorio)

En pantallas grandes, la página presenta un diseño claro y espacioso:
- Un encabezado con el título "Dashboard Financiero".
- Una cuadrícula (grid) de 4 columnas para los KPIs más importantes (MRR, ARR, Nuevos Tenants).
- Una segunda cuadrícula para las proyecciones y renovaciones.
- Una sección final con dos tarjetas grandes una al lado de la otra: una para el gráfico de "Distribución de Planes Activos" y otra como marcador de posición para futuras métricas.

#### 1.5. Diseño y UX (Móvil)

En dispositivos móviles, el diseño se adapta para ser completamente usable en una sola columna vertical:
- Los `StatsCard` se apilan uno encima del otro, ocupando todo el ancho disponible.
- Los gráficos también se muestran en tarjetas de ancho completo, una debajo de la otra.
- El diseño responsive se logra mediante las clases de utilidad de Tailwind CSS (ej. `sm:grid-cols-1`, `md:grid-cols-2`, `lg:grid-cols-4`), que ajustan el número de columnas de la cuadrícula según el tamaño de la pantalla.

### 2. Gestión de Tenants

#### 2.1. Listado de Tenants

**Archivo Principal:** `src/pages/Superadmin/TenantsList.tsx`

##### 2.1.1. Propósito y Funcionalidad

Esta página muestra una lista completa de todos los tenants (clientes) registrados en la plataforma. Permite al superadministrador buscar, visualizar y acceder a las acciones principales para cada tenant.

Las funcionalidades clave son:
- **Búsqueda:** Un campo de búsqueda permite filtrar la lista de tenants por nombre, email o ID. La búsqueda se activa con un `debounce` para no sobrecargar la base de datos con cada pulsación de tecla.
- **Listado:** Muestra los tenants en un formato de tabla (escritorio) o tarjetas (móvil).
- **Acciones:** Para cada tenant, se proporcionan botones para:
    - **Ver Detalles:** Navega a la página de detalles del tenant.
    - **Editar:** Navega al formulario de edición del tenant.
    - **Borrar:** Permite eliminar un tenant y todos sus datos asociados (esta acción solo está disponible en entorno de desarrollo para seguridad).
- **Creación:** Un botón prominente para navegar a la página de creación de un nuevo tenant.

##### 2.1.2. Componentes Utilizados

- **`Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow` (`@/components/ui/table`):** Para la vista de escritorio, se utiliza una tabla estándar para mostrar los datos de forma organizada.
- **`Card`, `CardContent`, `CardFooter`, `CardHeader`, `CardTitle` (`@/components/ui/card`):** Para la vista móvil, cada tenant se representa como una tarjeta individual, mejorando la legibilidad en pantallas pequeñas.
- **`Button` (`@/components/ui/button`):** Para todas las acciones interactivas (Crear, Editar, Borrar, Ver).
- **`Input` (`@/components/ui/input`):** Para el campo de búsqueda.
- **`Badge` (`@/components/ui/badge`):** Para mostrar el estado de la suscripción del tenant de forma visual.
- **Iconos (`lucide-react`):** Se usan iconos como `PlusCircle`, `Trash2`, `Edit`, `Search` y `Eye` para mejorar la usabilidad de los botones y campos.

##### 2.1.3. Hooks y Lógica de Datos

- **`useTenants` (`@/hooks/useTenants`):** Hook principal que obtiene la lista de tenants desde Supabase. Acepta el término de búsqueda (`debouncedSearchTerm`) para filtrar los resultados.
- **`useDeleteTenant` (`@/hooks/useDeleteTenant`):** Hook que proporciona la mutación para eliminar un tenant. Gestiona la llamada a la función RPC correspondiente y actualiza la UI en caso de éxito o error.
- **`useToast` (`@/hooks/use-toast`):** Para mostrar notificaciones (toasts) al usuario después de acciones como eliminar un tenant.
- **`useScreenSize` (`@/hooks/useScreenSize`):** Hook que detecta el tamaño de la pantalla (`mobile` o `desktop`) para renderizar condicionalmente la vista de tabla o la de tarjetas.
- **`useDebounce` (`@/hooks/useDebounce`):** Hook que retrasa la actualización del término de búsqueda, optimizando el rendimiento al evitar llamadas excesivas a la base de datos mientras el usuario escribe.

##### 2.1.4. Diseño y UX (Escritorio)

La vista de escritorio es una tabla clásica con las siguientes columnas:
- **Nombre:** Nombre del tenant.
- **Estado:** Estado de la suscripción (ej. "activo", "cancelado").
- **País:** País de operación del tenant.
- **Acciones:** Botones para ver, editar y borrar.

##### 2.1.5. Diseño y UX (Móvil)

La vista móvil cambia a una lista de tarjetas verticales. Cada tarjeta contiene:
- **Nombre del Tenant** en el encabezado.
- **País y Estado** en el contenido.
- **Botones de acción** en el pie de la tarjeta, optimizados para el tacto.
Este enfoque `mobile-first` asegura que la información más crítica sea fácilmente accesible en pantallas pequeñas.

#### 2.2. Creación de Tenant

**Archivo Principal:** `src/pages/Superadmin/CreateTenant.tsx`

##### 2.2.1. Propósito y Funcionalidad

Este formulario permite al superadministrador registrar un nuevo tenant en la plataforma, junto con su primer usuario administrador. Es un formulario extenso y detallado para asegurar que toda la información necesaria del nuevo cliente se capture desde el principio.

El proceso se realiza en una sola llamada a una función RPC de Supabase (`create_tenant_with_admin`), que maneja la creación del tenant y del usuario administrador de forma transaccional.

##### 2.2.2. Componentes Utilizados

- **`Form`, `FormControl`, `FormField`, `FormItem`, `FormLabel`, `FormMessage` (`@/components/ui/form`):** Componentes de `react-hook-form` y `shadcn/ui` para construir el formulario.
- **`Input` (`@/components/ui/input`):** Campos de texto estándar.
- **`SearchableSelect` (`@/components/ui/searchable-select`):** Selects con capacidad de búsqueda para País, Idioma, Moneda y Zona Horaria.
- **`AddressAutocompleteInput` (`@/components/AddressAutocompleteInput`):** Un campo de texto que se integra con la API de Google Places para autocompletar direcciones.
- **`MapDisplay` (`@/components/MapDisplay`):** Muestra un mapa de Google Maps con un marcador en la ubicación seleccionada.
- **`PhoneInput` (`@/components/PhoneInput`):** Un campo de entrada de teléfono que se adapta al prefijo del país seleccionado.
- **`Button` (`@/components/ui/button`):** Para enviar el formulario.

##### 2.2.3. Hooks y Lógica de Datos

- **`useForm` (`react-hook-form`):** Para la gestión del estado del formulario, validación y envío.
- **`zodResolver` (`@hookform/resolvers/zod`):** Para integrar la validación de esquemas de `zod` con `react-hook-form`.
- **`useTimezones`, `useLocalizations`, `useCountries`, `useCurrencies`:** Hooks personalizados para obtener los datos necesarios para los selects del formulario.
- **`useMutation` (`@tanstack/react-query`):** Para manejar la llamada asíncrona a la función `create_tenant_with_admin` de Supabase.
- **`useToast` (`@/hooks/use-toast`):** Para mostrar notificaciones de éxito o error.
- **`useNavigate` (`react-router-dom`):** Para redirigir al usuario a la lista de tenants después de la creación exitosa.

##### 2.2.4. Diseño y UX (Escritorio y Móvil)

El formulario está dividido en secciones lógicas utilizando tarjetas (`Card`) para mejorar la organización:
- Información Principal
- Configuración Regional
- Información de Contacto
- Información Fiscal
- Dirección Física (con autocompletado y mapa)
- Administrador Principal del Tenant

El diseño es responsive, utilizando un layout de cuadrícula (`grid`) que se adapta de una columna en móvil a dos o más columnas en escritorio, asegurando una buena experiencia de usuario en cualquier dispositivo.

#### 2.3. Detalles del Tenant

**Archivo Principal:** `src/pages/Superadmin/TenantDetails.tsx`

##### 2.3.1. Propósito y Funcionalidad

Esta página ofrece una vista de "solo lectura" con la información más relevante de un tenant específico. Sirve como un dashboard central para un cliente, desde donde el superadministrador puede supervisar la información clave y acceder a sub-secciones para gestionar aspectos más específicos como los usuarios y las **integraciones de infraestructura**.

La página se compone de tres bloques principales:
1.  **Información General:** Una tarjeta con los datos básicos del tenant (ID, País, Estado, etc.).
2.  **Gestión de Integraciones de Infraestructura (`TenantIntegrationManager`):** Permite al superadministrador conectar servicios (ej. Google Drive) a este tenant de forma transparente para él.
3.  **Gestión de Usuarios (`TenantUsersManager`):** Permite ver, crear y gestionar los usuarios asociados a ese tenant.

##### 2.3.2. Componentes Utilizados

- **`Card`, `CardContent`, `CardDescription`, `CardHeader`, `CardTitle` (`@/components/ui/card`):** Para estructurar la información en bloques visuales claros.
- **`TenantUsersManager` (`./TenantUsersManager`):** Un componente hijo complejo que encapsula toda la lógica para la gestión de usuarios del tenant.
- **`TenantIntegrationManager` (`./TenantIntegrationManager`):** Un componente hijo que maneja la conexión de servicios de infraestructura al tenant.

##### 2.3.3. Hooks y Lógica de Datos

- **`useParams` (`react-router-dom`):** Para obtener el `tenantId` de la URL, identificando así qué tenant mostrar.
- **`useTenantById` (`@/hooks/useTenants`):** Hook que recupera toda la información del tenant especificado por el `tenantId`.

##### 2.3.4. Diseño y UX (Escritorio y Móvil)

El diseño es limpio y está organizado en tarjetas apiladas verticalmente. Esto funciona bien tanto en escritorio como en móvil sin necesidad de grandes cambios en la disposición. La información se presenta de forma clara y concisa, con etiquetas bien definidas para cada dato.

#### 2.4. Edición de Tenant

**Archivo Principal:** `src/pages/Superadmin/EditTenant.tsx`

##### 2.4.1. Propósito y Funcionalidad

Esta página proporciona un formulario para modificar la información de un tenant existente. Es funcionalmente muy similar a la página de creación, pero está pre-poblada con los datos actuales del tenant.

Permite al superadministrador actualizar cualquier detalle del tenant, desde su nombre comercial y estado de suscripción hasta su dirección física y configuración regional.

##### 2.4.2. Componentes Utilizados

Los componentes son prácticamente los mismos que en el formulario de creación:
- **`Form`, `Input`, `SearchableSelect`, `AddressAutocompleteInput`, `MapDisplay`, `PhoneInput`, `Button`**.

##### 2.4.3. Hooks y Lógica de Datos

- **`useParams` (`react-router-dom`):** Para obtener el `tenantId` de la URL y saber qué tenant editar.
- **`useTenantById` (`@/hooks/useTenants`):** Para obtener los datos actuales del tenant y llenar el formulario.
- **`useUpdateTenant` (`@/hooks/useTenants`):** Hook que proporciona la mutación para enviar los datos actualizados a Supabase.
- **`useEffect` (`react`):** Se utiliza para poblar el formulario con los datos del tenant una vez que se han cargado (`form.reset(tenant)`).
- El resto de los hooks (`useForm`, `useToast`, `useNavigate`, etc.) se utilizan de manera similar a la página de creación.

##### 2.4.4. Diseño y UX (Escritorio y Móvil)

El diseño y la experiencia de usuario son idénticos al formulario de creación, manteniendo la consistencia. El formulario está dividido en las mismas secciones lógicas y es completamente responsive.

### 3. Configuración

#### 3.1. Planes de Suscripción

**Archivo Principal:** `src/pages/Superadmin/SubscriptionPlans.tsx`

##### 3.1.1. Propósito y Funcionalidad

Esta página permite al superadministrador gestionar los diferentes planes de suscripción que se ofrecen a los tenants. Desde aquí se pueden ver, crear, editar y eliminar los planes que definen las características y límites para los clientes.

Funcionalidades:
- **Listado:** Muestra los planes existentes con su nombre, descripción, estado (activo/inactivo) y orden de visualización.
- **Creación:** Un botón lleva al formulario para crear un nuevo plan.
- **Edición:** Cada plan tiene un botón para modificar sus detalles.
- **Eliminación:** Permite borrar un plan, con una confirmación para evitar acciones accidentales.

##### 3.1.2. Componentes Utilizados

- **`Table`, `Card`:** Al igual que en la lista de tenants, utiliza una tabla para la vista de escritorio y tarjetas para la vista móvil.
- **`Button`, `Badge`, `Iconos`:** Componentes estándar para acciones, estados y mejoras visuales.

##### 3.1.3. Hooks y Lógica de Datos

- **`useSubscriptionPlans` (`@/hooks/useSubscriptionPlans`):** Obtiene la lista de todos los planes de suscripción.
- **`useDeleteSubscriptionPlan` (`@/hooks/useSubscriptionPlans`):** Proporciona la mutación para eliminar un plan.
- **`useToast` (`@/hooks/use-toast`):** Para notificaciones.
- **`useScreenSize` (`@/hooks/useScreenSize`):** Para cambiar entre la vista de tabla y de tarjetas.

##### 3.1.4. Diseño y UX (Escritorio)

La vista de escritorio es una tabla con columnas para:
- **Orden:** El orden en que se mostrará el plan.
- **Nombre:** El nombre del plan.
- **Descripción:** Una breve descripción.
- **Activo:** Un badge que indica si el plan está activo.
- **Acciones:** Botones para editar y borrar.

##### 3.1.5. Diseño y UX (Móvil)

En móvil, cada plan se muestra en una tarjeta individual que contiene toda la información relevante y los botones de acción, optimizando el espacio y la usabilidad.

#### 3.2. Creación de Plan de Suscripción

**Archivo Principal:** `src/pages/Superadmin/CreateSubscriptionPlan.tsx`

##### 3.2.1. Propósito y Funcionalidad

Este formulario permite al superadministrador definir un nuevo plan de suscripción. Se capturan los detalles esenciales que determinarán el comportamiento y las limitaciones para los tenants que adquieran este plan.

Campos del formulario:
- **Nombre del Plan:** El nombre comercial del plan (ej. "Básico", "Profesional").
- **Descripción:** Un texto explicativo sobre el plan.
- **Límites:** Máximo de usuarios y sedes permitidos (opcional, si se deja en blanco es ilimitado).
- **Características:** Una lista de funcionalidades incluidas, separadas por comas.
- **Activo/Inactivo:** Un interruptor para habilitar o deshabilitar el plan.

##### 3.2.2. Componentes Utilizados

- **`Form`, `Input`, `Textarea`, `Switch`, `Button`:** Componentes estándar de `shadcn/ui` y `react-hook-form` para construir el formulario.

##### 3.2.3. Hooks y Lógica de Datos

- **`useCreateSubscriptionPlan` (`@/hooks/useSubscriptionPlans`):** Hook que contiene la mutación para enviar los datos del nuevo plan a Supabase.
- **`useForm`, `zodResolver`, `useToast`, `useNavigate`:** Hooks estándar para la gestión del formulario, validación y navegación.

##### 3.2.4. Diseño y UX (Escritorio y Móvil)

Es un formulario simple de una sola columna que se ve bien en todos los tamaños de pantalla. Los campos están claramente etiquetados y agrupados lógicamente. El interruptor para activar/desactivar el plan es un componente visualmente claro y fácil de usar.

#### 3.3. Edición de Plan de Suscripción

**Archivo Principal:** `src/pages/Superadmin/EditSubscriptionPlan.tsx`

##### 3.3.1. Propósito y Funcionalidad

Esta página es casi idéntica a la de creación de planes, pero se utiliza para modificar un plan existente. Carga los datos del plan seleccionado y permite al superadministrador ajustar todos sus parámetros.

##### 3.3.2. Componentes Utilizados

Los componentes son los mismos que en el formulario de creación: **`Form`, `Input`, `Textarea`, `Switch`, `Button`**.

##### 3.3.3. Hooks y Lógica de Datos

- **`useParams` (`react-router-dom`):** Para obtener el `planId` de la URL.
- **`useSubscriptionPlanById` (`@/hooks/useSubscriptionPlans`):** Para obtener los datos del plan a editar.
- **`useUpdateSubscriptionPlan` (`@/hooks/useSubscriptionPlans`):** Hook con la mutación para guardar los cambios.
- **`useEffect` (`react`):** Para poblar el formulario con los datos del plan una vez cargados.

##### 3.3.4. Diseño y UX (Escritorio y Móvil)

El diseño es idéntico al del formulario de creación, proporcionando una experiencia de usuario consistente.

#### 3.4. Gestión de Precios de Planes

**Archivo Principal:** `src/pages/Superadmin/PlanPricingManager.tsx`

##### 3.4.1. Propósito y Funcionalidad

Esta es una página de alto nivel que actúa como un dashboard para todo lo relacionado con los precios de los planes de suscripción. Permite al superadministrador no solo ver los precios actuales, sino también programar cambios de precios a futuro y revisar el historial.

La página está compuesta por cuatro sub-componentes principales que trabajan en conjunto:
1.  **`NewPriceScheduler`:** Un formulario para programar un nuevo precio para un plan específico en una fecha futura.
2.  **`CurrentPricesTable`:** Una tabla que muestra los precios vigentes para cada plan en cada país, calculados en base a la fecha actual.
3.  **`PriceHistory`:** Una tabla que muestra el último precio que estuvo vigente antes del actual.
4.  **`ScheduledPrices`:** Una tabla que lista todos los precios que han sido programados para entrar en vigencia en el futuro.

##### 3.4.2. Componentes Hijos y su Funcionalidad

- **`NewPriceScheduler` (`@/components/superadmin/NewPriceScheduler.tsx`):**
    - **Propósito:** Permite al superadministrador ser proactivo con la estrategia de precios. Puede establecer un nuevo precio base y un precio por sucursal extra para cualquier plan, y definir la fecha exacta en que este cambio se hará efectivo.
    - **Lógica:** Utiliza un formulario (`react-hook-form`) para capturar los datos y el hook `useCreatePlanPrice` para guardar la nueva entrada de precio en la base de datos.

- **`CurrentPricesTable` (`@/components/superadmin/CurrentPricesTable.tsx`):**
    - **Propósito:** Ofrece una vista clara y matricial de la estructura de precios actual. Muestra una tabla donde las filas son los países y las columnas son los planes, permitiendo ver rápidamente el precio de cada plan en cada mercado.
    - **Lógica:** Utiliza el hook `useCalculatedPrices` que, a su vez, llama a una función de base de datos (`get_calculated_prices`) para obtener los precios vigentes a la fecha actual. Es responsive, mostrando tarjetas por país en móvil.

- **`PriceHistory` (`@/components/superadmin/PriceHistory.tsx`):**
    - **Propósito:** Proporciona un contexto histórico, mostrando cuál era el precio de un plan antes del cambio más reciente. Es útil para análisis y seguimiento.
    - **Lógica:** Filtra el historial de precios (`useAllPlanPriceHistory`) para mostrar solo las entradas cuya fecha de vigencia es anterior a la actual.

- **`ScheduledPrices` (`@/components/superadmin/ScheduledPrices.tsx`):**
    - **Propósito:** Da visibilidad sobre los cambios de precios futuros. Permite al equipo administrativo y de ventas saber con antelación cuándo y cómo cambiarán los precios.
    - **Lógica:** Filtra el historial de precios para mostrar solo las entradas cuya fecha de vigencia es posterior a la actual.

##### 3.4.3. Hooks y Lógica de Datos

- **`useCalculatedPrices`, `useSubscriptionPlans`, `useAllPlanPriceHistory`:** Estos tres hooks obtienen todos los datos necesarios para que los componentes hijos puedan renderizar la información correcta.

##### 3.4.4. Diseño y UX (Escritorio y Móvil)

La página principal organiza los cuatro componentes en una disposición lógica y fácil de seguir. En escritorio, los componentes se organizan en una cuadrícula, mientras que en móvil se apilan verticalmente. Cada componente hijo es, a su vez, responsive, asegurando una experiencia de usuario fluida en cualquier dispositivo.

#### 3.5. Configuración Global

**Archivo Principal:** `src/pages/Superadmin/GlobalSettings.tsx`

##### 3.5.1. Propósito y Funcionalidad

Esta página centraliza todas las configuraciones que afectan al sistema en su totalidad, no a un tenant específico. Está organizada en pestañas para facilitar la navegación entre las diferentes áreas de configuración.

Las pestañas son:
- **General:** Muestra la información de la empresa Glamtica (dirección, contacto, etc.), que se obtiene de un "tenant global" especial.
- **Localizaciones:** Permite gestionar los idiomas disponibles en la plataforma.
- **Monedas:** Permite gestionar las monedas disponibles.
- **Países:** Permite gestionar los países y sus configuraciones por defecto (moneda, idioma, etc.).
- **Integraciones de Infraestructura Global:** Gestiona las integraciones a nivel de superadministrador (ej. una cuenta de Google Drive para almacenar archivos del sistema).

##### 3.5.2. Componentes Hijos y su Funcionalidad

- **`LocalizationsSettings`:**
    - **Propósito:** CRUD para los idiomas. Permite añadir, editar y ver los idiomas que se pueden asignar a los tenants.
    - **Componentes:** Utiliza una tabla (escritorio) o tarjetas (móvil) y un diálogo (`LocalizationDialog`) para la creación/edición.

- **`CurrenciesSettings`:**
    - **Propósito:** CRUD para las monedas. Permite gestionar todos los aspectos de una moneda, incluyendo su nombre, código, símbolo, si está activa y todos sus parámetros de formato (posición del símbolo, separadores, etc.). El campo `format` se calcula automáticamente al guardar, pero la previsualización en la lista se genera dinámicamente para reflejar la configuración en tiempo real.
    - **Componentes:** Usa tabla/tarjetas, un diálogo (`CurrencyDialog`) y un menú desplegable para las acciones. Contiene una función de utilidad (`formatCurrencyExample`) para generar la previsualización del formato.

- **`CountriesSettings`:**
    - **Propósito:** CRUD para los países. Permite definir los países en los que opera la plataforma y asignarles una configuración regional por defecto (idioma, moneda, prefijo telefónico, zona horaria).
    - **Componentes:** Usa tabla/tarjetas y un diálogo (`CountryDialog`).

- **`GlobalIntegrationsManager`:**
    - **Propósito:** Maneja la conexión con servicios de terceros para uso del sistema global. Actualmente, se usa para conectar una cuenta de Google Drive donde se almacenan, por ejemplo, los avatares de los superadministradores.
    - **Lógica:** Utiliza el `AuthContext` para obtener el estado de la integración y una función RPC (`get_google_auth_url`) para iniciar el flujo de autenticación de Google.

##### 3.5.3. Hooks y Lógica de Datos

- **`useTenantById` (`@/hooks/useTenants`):** Se usa en la pestaña "General" para obtener los datos de la empresa Glamtica, que se almacenan en un tenant con un ID especial (`00000000-...`).
- **`useScreenSize` (`@/hooks/useScreenSize`):** Para adaptar la lista de pestañas en móvil, haciéndola deslizable horizontalmente.

##### 3.5.4. Diseño y UX (Escritorio y Móvil)

La interfaz se basa en el componente `Tabs` de `shadcn/ui`, que es inherentemente responsive. En móvil, la lista de pestañas se vuelve deslizable si no cabe en la pantalla, lo cual es una excelente práctica de UX para no sobrecargar la interfaz.

### 4. Monitoreo

**Archivos Principales:** `SystemAlerts.tsx`, `ErrorReports.tsx`, `PerformanceMetrics.tsx`

#### 4.1. Propósito y Funcionalidad

Actualmente, estas tres páginas actúan como marcadores de posición (`placeholders`) para futuras funcionalidades de monitoreo del sistema. Su propósito es tener un lugar designado en la interfaz para cuando se implementen estas características.

- **Alertas del Sistema:** Destinada a mostrar alertas críticas o advertencias sobre la salud del sistema.
- **Reportes de Errores:** Destinada a mostrar un log o un dashboard de los errores que ocurren en la aplicación.
- **Métricas de Rendimiento:** Destinada a mostrar métricas detalladas sobre el rendimiento de la base de datos, la API, etc.

Por ahora, cada una de estas páginas simplemente renderiza un título y un texto indicando que el contenido está pendiente.

### 5. Avanzado

#### 5.1. Catálogo de Integraciones de Servicios

**Archivo Principal:** `src/pages/Superadmin/Integrations.tsx`

##### 5.1.1. Propósito y Funcionalidad

Esta página está destinada a que el superadministrador gestione el **catálogo de integraciones de servicios de terceros** que se ofrecerán a los tenants. Aquí no se configuran las credenciales de un tenant específico, sino que se define qué servicios están disponibles para ser activados por los tenants en sus propios portales.

**Ejemplos de funcionalidades:**
- Habilitar o deshabilitar un proveedor de facturación electrónica para un país específico.
- Añadir un nuevo proveedor de servicios de SMS a la lista de opciones disponibles.
- Configurar los parámetros básicos que el tenant necesitará llenar (ej. "API Key", "ID de Cliente").

Actualmente, la página es un prototipo y esta lógica de "catálogo" no está implementada.

##### 5.1.2. Componentes Utilizados

- **`IntegrationCard`:** Un componente reutilizable para mostrar una opción de integración (ej. Google Drive). Muestra el logo, el nombre, el estado de la conexión y el botón para conectar/desconectar.
- **`Card`, `Button`:** Componentes estándar de UI.

##### 5.1.3. Hooks y Lógica de Datos

- **`useGoogleAuthUrl`:** Hook que llama a la función RPC `get_google_auth_url` para obtener la URL de autorización de Google. Esta URL es la que inicia el proceso de consentimiento de OAuth2.
- **`useToast`:** Para mostrar notificaciones.

##### 5.1.4. Diseño y UX (Escritorio y Móvil)

La página muestra una serie de tarjetas, una por cada proveedor de almacenamiento disponible. El diseño es limpio y se adapta bien a cualquier tamaño de pantalla. El estado de la conexión es claro, mostrando un badge de "Conectado" y el email de la cuenta, o un botón de "Conectar".

## Fase 2: Backend (Base de Datos y Lógica de Negocio)

Esta sección detalla la arquitectura del backend en Supabase, incluyendo las tablas principales y las funciones RPC que dan soporte al portal de superadministrador.

### 1. Autenticación y Flujo de Sesión

El sistema de autenticación es personalizado y no depende directamente del sistema `auth` de Supabase para la gestión de sesiones. En su lugar, utiliza un flujo basado en JWT (JSON Web Tokens) generados a medida.

**Flujo Detallado:**

1.  **Inicio (Carga de la App):**
    *   El componente `AuthProvider` se monta y, en un `useEffect`, intenta leer un token JWT del `localStorage` (`supabase.auth.token`).
    *   Si encuentra un token, llama a `updateUserFromToken()`.

2.  **Validación del Token (`updateUserFromToken`):
    *   El token se decodifica con `jwt-decode`.
    *   Se verifica la fecha de expiración (`exp`). Si ha expirado, se llama a `logout()`.
    *   Si es válido, la información del payload (ID, email, rol, tenant_id, etc.) se usa para establecer el estado del usuario en el `AuthContext`.
    *   **Crucial:** El token se añade a las cabeceras globales del cliente de Supabase (`supabaseClient.global.headers['Authorization'] = `Bearer ${token}`). Esto asegura que todas las futuras peticiones a la API de Supabase (incluyendo llamadas a RPC y queries a tablas) incluyan este token para la autenticación y la aplicación de políticas RLS.

3.  **Proceso de Login (`login`):
    *   El usuario introduce su email y contraseña.
    *   Se llama a la función RPC `login_user(email, password)` en la base de datos.
    *   **`login_user` (RPC):**
        *   Busca al usuario por email.
        *   Verifica que la contraseña coincida usando la extensión `pgcrypto` (`public.crypt`).
        *   Si las credenciales son válidas, devuelve un objeto JSON con los datos del usuario (ID, rol, tenant_id, etc.), pero **no devuelve un token**.
    *   **`generate-jwt` (Edge Function):**
        *   Con los datos del usuario obtenidos de la RPC, el frontend llama a esta Edge Function.
        *   La función recibe los datos del usuario y el `VITE_SUPABASE_JWT_SECRET` desde el cliente.
        *   Construye el payload del JWT, incluyendo `app_metadata` con el rol del usuario.
        *   Firma el token usando el secreto y el algoritmo `HS256`.
        *   Devuelve el token firmado al frontend.
    *   El frontend recibe el token, lo guarda en `localStorage` y llama a `updateUserFromToken()` para establecer la sesión, completando el ciclo.

4.  **Protección de Rutas (`ProtectedRoute`):
    *   Este componente envuelve las rutas que requieren autenticación.
    *   Utiliza el hook `useAuth()` para acceder al estado `isAuthenticated` y `user`.
    *   Si `isAuthenticated` es `false`, redirige al usuario a la página de login (`/auth`).
    *   Si el usuario está autenticado, realiza una segunda capa de validación basada en roles. Por ejemplo, si un usuario con rol `super_admin` intenta acceder a una ruta que no empieza con `/superadmin`, es redirigido a su dashboard. Y viceversa.

5.  **Cierre de Sesión (`logout`):
    *   Elimina el token del `localStorage`.
    -   Elimina la cabecera `Authorization` del cliente de Supabase.
    *   Establece el estado del usuario en `AuthContext` a `null`.
    *   Redirige al usuario a la página de login.

### 2. Funciones de Base de Datos (RPC)

A continuación se describen las funciones más importantes accesibles solo por el superadministrador.

#### 2.1. Setup y Autenticación

- **`check_superadmin_exists()`**: 
    - **Propósito:** Verifica si ya se ha creado un usuario con el rol `super_admin`.
    - **Uso:** Se llama al iniciar la aplicación para determinar si se debe redirigir a la página de configuración inicial (`/setup-superadmin`).

- **`create_application_superadmin(email, password)`**:
    - **Propósito:** Crea el primer usuario superadministrador en el sistema.
    - **Lógica:** Inserta un nuevo usuario en `public.users` y le asigna el rol `super_admin`.
    - **Seguridad:** Debería ser una función que solo se puede ejecutar una vez o estar protegida de alguna otra forma después del setup inicial.

#### 2.2. Gestión de Tenants

- **`create_tenant_with_admin(...)`**:
    - **Propósito:** Es una de las funciones más importantes. Crea un nuevo tenant y, de forma transaccional, crea también el primer usuario administrador para ese tenant.
    - **Parámetros:** Acepta todos los detalles del tenant (nombre, país, etc.) y las credenciales del administrador (email, contraseña).
    - **Lógica:** Inserta en `tenants`, luego en `public.users`, y finalmente asocia el usuario al tenant con el rol `tenant_admin`.

- **`update_tenant_status(tenant_id, status)`**:
    - **Propósito:** Permite al superadministrador cambiar el estado de la suscripción de un tenant (ej. de `active` a `inactive`).
    - **Seguridad:** Verifica que quien llama a la función sea un `super_admin`.

- **`delete_tenant_cascade(tenant_id)`**:
    - **Propósito:** Elimina un tenant y todos sus datos asociados (usuarios, citas, servicios, etc.).
    - **Lógica:** Utiliza `DELETE ... CASCADE` en la base de datos para asegurar una eliminación completa y limpia.
    - **Seguridad:** Es una operación destructiva, estrictamente limitada al `super_admin`.

#### 2.3. Estadísticas y Monitoreo

- **`get_superadmin_dashboard_stats()` / `get_superadmin_financial_stats()`**:
    - **Propósito:** Calculan las métricas clave (MRR, ARR, nuevos tenants, etc.) que se muestran en el dashboard principal del superadministrador.
    - **Lógica:** Realizan agregaciones y cálculos complejos sobre las tablas de `tenants` y `subscriptions`.

- **`get_tenant_activity_summary()`, `get_usage_statistics()`, `get_tenant_access_logs()`**:
    - **Propósito:** Son funciones preparadas para futuras funcionalidades de monitoreo. Permitirán al superadministrador supervisar la actividad y el uso de la plataforma por parte de los tenants.

#### 2.4. Precios e Integraciones

- **`get_calculated_prices()`**:
    - **Propósito:** Devuelve los precios vigentes de todos los planes para todos los países en la fecha actual.
    - **Lógica:** Consulta la tabla `plan_prices` y, para cada plan y país, selecciona el precio más reciente cuya `effective_date` no sea futura.

- **`get_google_auth_url(p_tenant_id)`**:
    - **Propósito:** Genera la URL de autorización de Google OAuth2, incluyendo el `client_id`, `redirect_uri`, `scope` y un `state` que contiene el `tenant_id` para asociar la credencial al tenant correcto después de la redirección.
    - **Uso:** Es el primer paso en el flujo de integración con Google Drive.

### 3. Diccionario de Datos

#### 3.1. Tablas Principales

| Tabla | Columna | Tipo de Dato | Descripción |
| :--- | :--- | :--- | :--- |
| `tenants` | `id` | `uuid` | Identificador único del tenant. El ID `0000...` se reserva para configuraciones globales. |
| | `name` | `text` | Nombre comercial del tenant. |
| | `subscription_status` | `text` | Estado: 'trial', 'active', 'inactive', 'cancelled'. |
| | `country_id` | `uuid` | FK a la tabla `countries`. |
| | `default_language_code` | `text` | FK a `languages.iso_code`. Idioma por defecto. |
| | `default_currency_id` | `uuid` | FK a `currencies.id`. Moneda por defecto. |
| | `default_timezone` | `text` | Zona horaria por defecto. |
| `users` | `id` | `uuid` | Identificador único del usuario. |
| | `tenant_id` | `uuid` | FK a `tenants.id`. Indica a qué tenant pertenece el usuario. `NULL` para super_admin. |
| | `branch_id` | `uuid` | FK a `branches.id`. Sede a la que pertenece el usuario. |
| | `role_id` | `uuid` | FK a `roles.id`. Define los permisos del usuario. |
| | `email` | `text` | Email del usuario (único). |
| | `password_hash` | `text` | Hash de la contraseña (generado con `pgcrypto.crypt`). |
| | `is_active` | `boolean` | Indica si el usuario puede iniciar sesión. |
| `roles` | `id` | `uuid` | Identificador único del rol. |
| | `name` | `text` | Nombre del rol: 'super_admin', 'tenant_super_admin', 'tenant_admin', 'tenant_user'. |
| `subscription_plans` | `id` | `uuid` | Identificador único del plan. |
| | `name` | `text` | Nombre del plan (ej. 'Básico'). |
| | `max_users` | `integer` | Límite de usuarios para este plan. `NULL` para ilimitado. |
| | `max_branches` | `integer` | Límite de sedes para este plan. `NULL` para ilimitado. |
| `plan_prices` | `id` | `uuid` | Identificador único del registro de precio. |
| | `subscription_plan_id` | `uuid` | FK a `subscription_plans.id`. |
| | `base_price_cop` | `numeric` | Precio base del plan en COP. |
| | `effective_date` | `date` | Fecha a partir de la cual este precio es válido. |

#### 3.2. Tablas de Configuración Regional

| Tabla | Columna | Tipo de Dato | Descripción |
| :--- | :--- | :--- | :--- |
| `languages` | `iso_code` | `text` | Código de idioma (ej. 'es', 'en'). Clave primaria. |
| | `name` | `text` | Nombre del idioma (ej. 'Español'). |
| `currencies` | `id` | `uuid` | Identificador único de la moneda. |
| | `code` | `text` | Código de moneda (ej. 'COP', 'USD'). |
| | `symbol` | `text` | Símbolo de la moneda (ej. '$'). |
| | `symbol_position` | `text` | Posición del símbolo: 'before' o 'after'. |
| | `decimal_separator` | `text` | Separador de decimales (ej. '.'). |
| | `thousands_separator` | `text` | Separador de miles (ej. ','). |
| `countries` | `id` | `uuid` | Identificador único del país. |
| | `name` | `text` | Nombre del país. |
| | `iso_code` | `text` | Código ISO del país (ej. 'CO', 'US'). |
| | `phone_prefix_id` | `uuid` | FK a `phone_prefixes.id`. |
### Módulo: Mi Perfil

#### Optimización de la Interfaz de Pestañas

**Fecha:** 2025-07-15

Se ha realizado una optimización en el componente de la página "Mi Perfil" para mejorar la forma en que se cargan y muestran las pestañas de "Información Personal", "Configuración Regional" y "Seguridad".

**Nota Importante:** Esta mejora interna está **pendiente de una verificación funcional completa** para asegurar que todo sigue operando como se espera.

---

# Gestión de Plantillas de Correo

El sistema utiliza un motor de plantillas para todas las comunicaciones por correo electrónico. Como superadministrador, tienes control total sobre el contenido de estas plantillas.

## ¿Cómo Funciona?

1.  **Plantillas Maestras**: Tú defines y gestionas un conjunto de plantillas maestras para cada evento del sistema (ej. "Bienvenida de Usuario", "Recordatorio de Cita") y para cada idioma soportado.
2.  **Control del Tenant**: Los administradores de cada tenant no pueden editar el contenido de tus plantillas, pero pueden **activar o desactivar** ciertas comunicaciones para su negocio (ej. pueden desactivar los recordatorios de citas si no los necesitan).
3.  **Propagación Automática**: Al crear una nueva plantilla maestra (ej. "Resumen de Ventas Semanal"), puedes marcarla para que se "propague" a todos los tenants nuevos. Esto significa que automáticamente les aparecerá la opción para activar o desactivar esta nueva comunicación en su panel.

*(Nota: La interfaz para gestionar estas plantillas y configuraciones se desarrollará en una fase posterior.)*
---
### Módulo: Centralización de Llamadas a Base de Datos en `tenant-actions`

**Fecha de Finalización:** 15 de agosto de 2025

**Descripción General:**
Se ha refactorizado el módulo de atenciones para centralizar todas las llamadas directas a la base de datos a través de la Edge Function `tenant-actions`. Esta estandarización mejora la seguridad, el mantenimiento y la consistencia del código.

**Funcionalidades Clave:**

1.  **Creación de Nuevos `case` en `tenant-actions`:**
    -   Se han añadido nuevos `case` a la Edge Function para manejar todas las operaciones de base de datos del módulo de atenciones, incluyendo la obtención de atenciones, la creación y cancelación de las mismas, la adición de servicios y la obtención de usuarios disponibles.

2.  **Refactorización de Hooks:**
    -   Se han modificado los hooks `useAttentions`, `useAttentionServices` y `useAvailableUsers` para que utilicen la función `callTenantAction` en lugar de realizar llamadas directas a Supabase (`supabase.from(...)` o `supabase.rpc(...)`).

**Componentes Técnicos Modificados:**

-   **Edge Function:** `supabase/functions/tenant-actions/index.ts`
-   **Hooks:** `useAttentions.ts`, `useAttentionServices.ts`, `useAvailableUsers.ts`

**Estado:** Completado y verificado.