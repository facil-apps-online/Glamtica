# Glamtica.app - Plan de Trabajo

## Información del Proyecto

**Nombre:** Glamtica.app   
**Descripción:** Sistema ERP multitenant para empresas mayoristas y minoristas del sector de la belleza
(Salones de belleza, barberías, peluquerías), con funcionalidades completas de ventas, compras, 
inventario, POS, CRM, agenda, y más.

## Notas Técnicas Críticas

- [x] Se utiliza Supabase Auth para la gestión de sesiones, pero los roles y permisos se gestionan con tablas propias.
- [x] No usar la librería bcrypt. El sistema debe implementar un método propio de hash para contraseñas, con salt seguro.
- [x] Multitenancy debe manejarse mediante un solo esquema compartido. Toda la información debe aislarse con tenant_id.
- [x] La plataforma debe soportar múltiples países, con precios de suscripción configurables por país.
- [x] El sistema debe ser completamente multilenguaje, con idiomas habilitados por el superadmin y seleccionables por el usuario.
- [x] La configuración regional (idioma, moneda, zona horaria) debe poder aplicarse a nivel de sistema, tenant, sede y usuario.

---

## FASE 1: Fundamentos del Sistema y Arquitectura de Datos

### 1.1 Diseño y Creación del Esquema de Base de Datos
- [x] **Tablas principales del sistema**
- [x] **Tablas de negocio**
- [x] **Configuraciones regionales**
- [x] **Índices y constraints**

### 1.2 Sistema de Autenticación y Autorización Custom
- [x] **Módulo de hash de contraseñas**
- [x] **Gestión de sesiones**
- [x] **Sistema de autorización**

### 1.3 Configuración de Multi-Tenancy
- [x] **Contexto de tenant**
- [x] **Filtros automáticos**

### 1.4 Framework de Internacionalización (i18n)
- [x] **Configuración base**

---

## FASE 2: Desarrollo de Módulos por Rol

### 2.1 Módulo de Superadmin
- [x] **Dashboard Financiero (`SuperadminStats.tsx`)**
- [x] **Gestión de Tenants (CRUD Completo)**
  - [x] Listar y buscar tenants (`TenantsList.tsx`)
  - [x] Crear nuevo tenant y administrador (`CreateTenant.tsx`)
  - [x] Ver detalles del tenant (`TenantDetails.tsx`)
  - [x] Editar tenant existente (`EditTenant.tsx`)
  - [x] Gestionar Integraciones de Infraestructura por Tenant (`TenantIntegrationManager.tsx`)
- [x] **Gestión de Planes y Precios**
  - [x] CRUD de Planes de Suscripción (`SubscriptionPlans.tsx`, `CreateSubscriptionPlan.tsx`, `EditSubscriptionPlan.tsx`)
  - [x] Sistema de Precios Versionado y Automatizado (`PlanPricingManager.tsx`)
- [x] **Configuración Global del Sistema (`GlobalSettings.tsx`)**
  - [x] Pestaña General (Datos de la empresa)
  - [x] Gestión de Localizaciones (Idiomas)
  - [x] Gestión de Monedas
  - [x] Gestión de Países y Prefijos Telefónicos
  - [x] Gestión de Integraciones de Infraestructura Global (`GlobalIntegrationsManager.tsx`)
- [ ] **Gestión del Catálogo de Integraciones de Servicios (`Integrations.tsx`)**
  - [ ] Definir proveedores de servicios (ej. Facturación Electrónica, SMS).
  - [ ] Asociar proveedores a países.
  - [ ] Definir los campos de configuración requeridos por cada proveedor.
- [ ] **Monitoreo del Sistema**
  - [ ] Alertas del Sistema (`SystemAlerts.tsx`)
  - [ ] Reportes de Errores (`ErrorReports.tsx`)
  - [ ] Métricas de Rendimiento (`PerformanceMetrics.tsx`)
- [x] **Navegación y Layout del Panel (`SuperadminLayout.tsx`, `SuperadminSidebar.tsx`, `SuperadminHeader.tsx`)**
- [x] **Perfil de Superadministrador (`ProfileSettings.tsx`)**
  - [x] Implementación de Pestañas (Info, Seguridad, Regional)
  - [x] Corrección de Flujo de Guardado y Sincronización de Estado

### 2.2 Módulo de Tenant Superadmin
- [ ] **Configuración de la Empresa**
- [ ] **Gestión de Sedes**
- [ ] **Flujos de Trabajo y Reglas**
- [ ] **Gestión de Módulos por Sede**
- [ ] **Reportes Consolidados**
- [ ] **Roles y Perfiles Personalizados**

### 2.3 Módulo de Tenant Admin (Administrador de Sede)
- [ ] **Gestión de Usuarios Operativos**
- [ ] **Gestión de Bodegas**
- [ ] **Configuración Local de Sede**
- [ ] **Gestión de Ciclos de Negocio**
- [ ] **Aprobación y Trazabilidad**
- [ ] **Gestión de Compras**

### 2.4 Módulo de Usuario Operativo
- [x] **Acceso y Configuración Personal**
- [ ] **Punto de Venta (POS)**
- [ ] **Gestión de Taller**
- [ ] **Acceso a Reportes**

---

## FASE 3: Funcionalidades Avanzadas

### 3.1 Integración y APIs
- [x] **Integración con Almacenamiento en la Nube (Google Drive)**
  - [x] Implementar la página de callback de OAuth de Google.
  - [x] Depuración de la Edge Function de intercambio de tokens (`google-oauth-token`).
  - [x] Implementar la lógica de subida de archivos a Google Drive.
- [x] **Integración con Almacenamiento en la Nube (Google Drive)**
  - [x] Implementar la página de callback de OAuth de Google.
  - [x] Depuración de la Edge Function de intercambio de tokens (`google-oauth-token`).
  - [x] Implementar la lógica de subida de archivos a Google Drive.
- [EN PROGRESO] **APIs REST**
- [ ] **Integraciones externas**

### 3.2 Reportes y Analytics
- [ ] **Motor de reportes**

### 3.3 Optimización y Performance
- [ ] **Optimización de base de datos**
- [ ] **Performance del frontend**

### 3.4 Notificaciones Push
- [ ] **Integración con servicio de notificaciones**
- [ ] **Gestión de preferencias de notificación**
- [ ] **Notificaciones en tiempo real**

---

## Estado del Proyecto

**Última actualización:** 13 de julio de 2025  
**Fase actual:** Fase 3 - Funcionalidades Avanzadas  
**Progreso general:** En desarrollo
