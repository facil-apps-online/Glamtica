# Glamtica.app - Plan de Trabajo

## Información del Proyecto

**Nombre:** Glamtica.app   
**Descripción:** Sistema ERP multitenant para empresas mayoristas y minoristas del sector de la belleza
(Salones de belleza, barberías, peluquerías), con funcionalidades completas de ventas, compras, 
inventario, POS, CRM, agenda, y más.

## Notas Técnicas Críticas

- [ ] No usar Supabase Auth ni roles nativos del motor PostgreSQL. Toda la gestión de usuarios y permisos debe realizarse con tablas propias.
- [ ] No usar la librería bcrypt. El sistema debe implementar un método propio de hash para contraseñas, con salt seguro.
- [ ] Multitenancy debe manejarse mediante un solo esquema compartido. Toda la información debe aislarse con tenant_id.
- [ ] La plataforma debe soportar múltiples países, con precios de suscripción configurables por país.
- [ ] El sistema debe ser completamente multilenguaje, con idiomas habilitados por el superadmin y seleccionables por el usuario.
- [ ] La configuración regional (idioma, moneda, zona horaria) debe poder aplicarse a nivel de sistema, tenant, sede y usuario.

---

## FASE 1: Fundamentos del Sistema y Arquitectura de Datos

### 1.1 Diseño y Creación del Esquema de Base de Datos
- [ ] **Tablas principales del sistema**
  - [x] `tenants` - Información de empresas/clientes
  - [x] `users` - Usuarios del sistema
  - [x] `roles` - Roles personalizables
  - [ ] `permissions` - Permisos granulares
  - [ ] `user_permissions` - Relación usuarios-permisos
  - [ ] `menu_permissions` - Control de acceso por menú o funcionalidad
  - [x] `tenant_sites` - Sedes por tenant
  - [ ] `subscription_plans` - Planes de suscripción
  - [ ] `countries` - Países soportados
  - [ ] `currencies` - Monedas del sistema
  - [x] `languages` - Idiomas disponibles

- [ ] **Tablas de negocio**
  - [x] `clients` - Clientes
  - [x] `stylists` - Estilistas/Empleados
  - [x] `services` - Servicios ofrecidos
  - [x] `products` - Productos de inventario
  - [x] `attentions` - Atenciones/Citas principales
  - [x] `purchases` - Compras a proveedores
  - [ ] `languages` - Idiomas disponibles
  - [x] `translations` - Traducciones de textos
  - [x] `brands` - Marcas de productos
  - [x] `suppliers` - Proveedores
  - [x] `schedule_templates` - Plantillas de horarios
  - [x] `stylist_schedules` - Horarios de estilistas
  - [x] `stylist_time_off` - Ausencias de estilistas
  - [x] `service_categories` - Categorías de servicios
  - [x] `attention_service_products` - Productos vendidos por servicio
  - [x] `attention_products` - Productos vendidos en una atención
  - [x] `service_evidence` - Evidencia de servicios (fotos, etc.)
  - [x] `service_sessions` - Sesiones de servicios
  - [x] `attention_services` - Servicios dentro de una atención
  - [x] `extra_service_sessions` - Sesiones de servicios extra
  - [x] `appointment_evidence` - Evidencia de citas (antiguo)
  - [x] `appointment_products` - Productos de citas (antiguo)
  - [x] `appointment_extra_services` - Servicios extra de citas (antiguo)
  - [x] `appointment_sessions` - Sesiones de citas (antiguo)
  - [x] `appointments` - Citas (antiguo)
  - [x] `purchase_items` - Items de compra
  - [x] `product_stylist_commissions` - Comisiones de estilistas por producto
  - [x] `supplier_products` - Productos por proveedor
  - [x] `service_stylist_commissions` - Comisiones de estilistas por servicio
  

- [ ] **Configuraciones regionales**
  - [x] Campos de configuración regional en `tenants`
  - [x] Campos de configuración regional en `tenant_sites`
  - [x] Campos de configuración regional en `users`
  - [~] Tabla `tenant_subscriptions` - Suscripciones por país

- [ ] **Índices y constraints**
  - [x] Índices por `tenant_id` en todas las tablas de negocio
  - [x] Foreign keys apropiadas
  - [x] Constraints de unicidad necesarias

### 1.2 Sistema de Autenticación y Autorización Custom

- [x] **Módulo de hash de contraseñas**
  - [x] Implementar algoritmo de hash seguro (sin bcrypt)
  - [x] Generación de salt aleatorio
  - [x] Función de verificación de contraseñas

- [ ] **Gestión de sesiones**
  - [ ] Sistema de tokens JWT o sesiones seguras
  - [ ] Middleware de autenticación
  - [ ] Manejo de expiración de sesiones
  - [ ] Logout seguro

- [x] **Sistema de autorización**
  - [x] Middleware de autorización basado en roles
  - [x] Verificación de permisos granulares y por menú
  - [x] Control de acceso por módulos/funcionalidades

### 1.3 Configuración de Multi-Tenancy

- [x] **Contexto de tenant**
  - [x] Identificación automática del tenant_id
  - [x] Middleware para inyectar tenant_id en queries
  - [x] Validación de aislamiento de datos

- [x] **Filtros automáticos**
  - [x] ORM/Query builder con filtro automático por tenant_id
  - [x] Prevención de acceso cruzado entre tenants
  - [ ] Auditoría de acceso a datos

### 1.4 Framework de Internacionalización (i18n)

- [x] **Configuración base**
  - [ ] Integración de react-i18next
  - [ ] Estructura de archivos de traducción
  - [ ] Carga dinámica de idiomas
  - [x] Tabla `translations` o `i18n_keys` para textos del sistema

- [x] **Localización**
  - [ ] Formateo de fechas por región
  - [ ] Formateo de monedas
  - [ ] Formateo de números
  - [x] Manejo de zonas horarias

- [ ] **Datos multilingües**
  - [ ] Estructura para nombres de productos multiidioma
  - [ ] Descripciones en múltiples idiomas
  - [ ] Interfaz de administración de traducciones

---

## FASE 2: Desarrollo de Módulos por Rol

### 2.1 Módulo de Superadmin

#### 2.1.1 Gestión de Tenants
- [ ] **CRUD de Tenants**
  - [ ] Crear nuevo tenant
  - [ ] Listar tenants con filtros
  - [ ] Editar información de tenant
  - [ ] Activar/suspender tenant
  - [ ] Ver detalles completos del tenant

- [ ] **Asignación de Tenant Superadmin**
  - [ ] Crear usuario administrador principal
  - [ ] Asignar rol de Tenant Superadmin
  - [ ] Envío de credenciales iniciales

#### 2.1.2 Planes de Suscripción y Precios
- [ ] **Gestión de planes**
  - [ ] Crear/editar planes de suscripción
  - [ ] Definir características por plan
  - [ ] Configurar límites por plan

- [ ] **Precios por país**
  - [ ] Configurar precios específicos por país
  - [ ] Gestión de monedas por región
  - [ ] Historial de cambios de precios

#### 2.1.3 Configuración Global del Sistema
- [ ] **Parámetros globales**
  - [ ] Configuración de monedas base
  - [ ] Impuestos genéricos
  - [ ] Formatos de fecha globales
  - [ ] Configuraciones de seguridad

- [ ] **Gestión de idiomas**
  - [ ] Habilitar/deshabilitar idiomas
  - [ ] Configurar idioma por defecto
  - [ ] Gestión de traducciones del sistema

#### 2.1.4 Monitoreo del Sistema
- [ ] **Dashboard de superadmin**
  - [ ] Métricas generales del sistema
  - [ ] Actividad por tenant
  - [ ] Estadísticas de uso
  - [ ] Alertas del sistema

- [ ] **Reportes de actividad**
  - [ ] Logs de acceso por tenant
  - [ ] Reportes de errores
  - [ ] Métricas de rendimiento

### 2.2 Módulo de Tenant Superadmin

#### 2.2.1 Configuración de la Empresa
- [ ] **Información básica**
  - [ ] Datos de la empresa (nombre, NIT, etc.)
  - [ ] Logo y branding
  - [ ] Configuración regional (moneda, idioma, zona horaria)

- [ ] **Personalización**
  - [ ] Colores corporativos
  - [ ] Configuración de documentos
  - [ ] Plantillas personalizadas

#### 2.2.2 Gestión de Sedes
- [ ] **CRUD de sedes**
  - [ ] Registrar nuevas sedes
  - [ ] Configurar información por sede
  - [ ] Asignar administradores de sede
  - [ ] Activar/desactivar sedes

#### 2.2.3 Flujos de Trabajo y Reglas
- [ ] **Configuración de flujos**
  - [ ] Definir flujos para órdenes de compra
  - [ ] Configurar aprobaciones para facturas
  - [ ] Reglas de negocio personalizadas

#### 2.2.4 Gestión de Módulos por Sede
- [ ] **Control de módulos**
  - [ ] Activar/desactivar módulos por sede
  - [ ] Configurar permisos por módulo
  - [ ] Restricciones de funcionalidades

#### 2.2.5 Reportes Consolidados
- [ ] **Reportes multi-sede**
  - [ ] Ventas consolidadas
  - [ ] Inventarios por sede
  - [ ] Rendimiento comparativo
  - [ ] Análisis financiero

#### 2.2.6 Roles y Perfiles Personalizados
- [ ] **Gestión de roles**
  - [ ] Crear roles personalizados
  - [ ] Asignar permisos granulares
  - [ ] Plantillas de roles predefinidas

### 2.3 Módulo de Tenant Admin (Administrador de Sede)

#### 2.3.1 Gestión de Usuarios Operativos
- [ ] **CRUD de usuarios**
  - [ ] Crear usuarios operativos
  - [ ] Asignar roles y permisos
  - [ ] Gestionar accesos por módulo
  - [ ] Control de permisos detallados (lectura, edición, reportes)

#### 2.3.2 Gestión de Bodegas
- [ ] **CRUD de bodegas**
  - [ ] Registrar múltiples bodegas
  - [ ] Configurar ubicaciones
  - [ ] Asignar responsables
  - [ ] Control de acceso por bodega

#### 2.3.3 Configuración Local de Sede
- [ ] **Configuraciones específicas**
  - [ ] Impuestos locales
  - [ ] Zona horaria específica
  - [ ] Moneda local
  - [ ] Configuraciones de documentos

#### 2.3.4 Gestión de Ciclos de Negocio
- [ ] **Módulo de Ventas**
  - [ ] Registro de ventas
  - [ ] Gestión de clientes
  - [ ] Cotizaciones
  - [ ] Facturación

- [ ] **Módulo de Compras**
  - [ ] Órdenes de compra
  - [ ] Recepción de mercancía
  - [ ] Gestión de proveedores
  - [ ] Control de pagos

- [ ] **Módulo de Inventarios**
  - [ ] Control de stock
  - [ ] Movimientos de inventario
  - [ ] Ajustes de inventario
  - [ ] Reportes de inventario

- [ ] **Módulo POS**
  - [ ] Punto de venta
  - [ ] Integración con inventario
  - [ ] Métodos de pago
  - [ ] Impresión de tickets

- [ ] **Módulo de Agenda**
  - [ ] Atenciones
  - [ ] Gestión de servicios
  - [ ] Control de productos
  - [ ] Seguimiento de Atenciones

#### 2.3.5 Aprobación y Trazabilidad
- [ ] **Sistema de aprobaciones**
  - [ ] Flujos de aprobación configurables
  - [ ] Aprobación de devoluciones
  - [ ] Anulaciones con justificación
  - [ ] Auditoría completa

### 2.4 Módulo de Usuario Operativo

#### 2.4.1 Acceso y Configuración Personal
- [ ] **Inicio de sesión**
  - [ ] Autenticación segura
  - [ ] Acceso controlado por permisos
  - [ ] Dashboard personalizado por rol

- [ ] **Configuración personal**
  - [ ] Cambio de idioma
  - [ ] Formato de fecha/hora
  - [ ] Preferencias de interfaz

#### 2.4.2 Punto de Venta (POS)
- [ ] **Funcionalidades POS**
  - [ ] Lectura de códigos de barras
  - [ ] Búsqueda rápida de productos
  - [ ] Verificación de compatibilidad
  - [ ] Cálculo automático de precios e impuestos
  - [ ] Múltiples métodos de pago

#### 2.4.3 Gestión de Compras
- [ ] **Registro de compras**
  - [ ] Ingreso de órdenes de compra
  - [ ] Recepción de mercancía
  - [ ] Actualización automática de inventario
  - [ ] Validación de precios y cantidades

#### 2.4.4 Gestión de Taller
- [ ] **Órdenes de trabajo**
  - [ ] Crear nuevas órdenes
  - [ ] Asignar técnicos
  - [ ] Registrar servicios realizados
  - [ ] Control de repuestos utilizados
  - [ ] Seguimiento de estado

#### 2.4.5 Acceso a Reportes
- [ ] **Reportes según permisos**
  - [ ] Reportes de ventas personales
  - [ ] Estadísticas de desempeño
  - [ ] Reportes de inventario (si aplica)
  - [ ] Exportación de datos

---

## FASE 3: Funcionalidades Avanzadas

### 3.1 Integración y APIs
- [ ] **APIs REST**
  - [ ] Documentación completa
  - [ ] Autenticación por API keys
  - [ ] Rate limiting
  - [ ] Versionado de APIs

- [ ] **Integraciones externas**
  - [ ] Sistemas contables
  - [ ] Plataformas de e-commerce
  - [ ] Servicios de mensajería
  - [ ] Gateways de pago
  - [ ] Facturación electrónica por país

### 3.2 Reportes y Analytics
- [ ] **Motor de reportes**
  - [ ] Constructor de reportes dinámicos
  - [ ] Exportación múltiples formatos
  - [ ] Reportes programados
  - [ ] Dashboard analítico

### 3.3 Optimización y Performance
- [ ] **Optimización de base de datos**
  - [ ] Índices optimizados
  - [ ] Queries eficientes
  - [ ] Cacheo inteligente
  - [ ] Particionado de tablas grandes

- [ ] **Performance del frontend**
  - [ ] Lazy loading
  - [ ] Optimización de bundle
  - [ ] PWA capabilities
  - [ ] Offline functionality

---

## Estado del Proyecto

**Última actualización:** 10 de julio de 2025  
**Fase actual:** Fase 1 - Fundamentos del Sistema  
**Progreso general:** 50%

### Leyenda
- [ ] Pendiente
- [~] En progreso  
- [x] Completado
- [!] Bloqueado/Requiere atención

### Notas de Desarrollo
- Agregar aquí notas importantes durante el desarrollo
- Decisiones técnicas tomadas
- Cambios en el alcance
- Issues encontrados y soluciones
- Archivo para documentar: WORK_DOCUMENTS.md

---

## Recursos y Referencias

### Documentación Técnica
- [ ] Documentación de API
- [ ] Guía de instalación
- [ ] Manual de usuario por rol
- [ ] Documentación de base de datos

### Testing
- [ ] Plan de pruebas unitarias
- [ ] Pruebas de integración
- [ ] Pruebas de seguridad
- [ ] Pruebas de performance
- [ ] Pruebas de multi-tenancy

### Deployment
- [ ] Configuración de entornos
- [ ] Scripts de migración
- [ ] Documentación de deployment
- [ ] Monitoreo y logs