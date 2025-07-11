# Glamtica.app - Documento de Trabajo

## Progreso de la Fase 1: Fundamentos del Sistema y Arquitectura de Datos

### 1.1 Diseño y Creación del Esquema de Base de Datos

**Tablas principales del sistema:**
- `tenants`: Completada.
- `users`: Completada.
- `roles`: Completada.
- `tenant_sites` (como `branches`): Completada.
- `languages`: Completada.

**Tablas de negocio:**
- `clients`: Completada.
- `stylists`: Completada.
- `services`: Completada.
- `products`: Completada.
- `attentions`: Completada.
- `purchases`: Completada.
- `translations`: Completada.
- `brands`: Completada.
- `suppliers`: Completada.
- `schedule_templates`: Completada.
- `stylist_schedules`: Completada.
- `stylist_time_off`: Completada.
- `service_categories`: Completada.
- `attention_service_products`: Completada.
- `attention_products`: Completada.
- `service_evidence`: Completada.
- `service_sessions`: Completada.
- `attention_services`: Completada.
- `extra_service_sessions`: Completada.
- `appointment_evidence`: Completada (tablas antiguas migradas).
- `appointment_products`: Completada (tablas antiguas migradas).
- `appointment_extra_services`: Completada (tablas antiguas migradas).
- `appointment_sessions`: Completada (tablas antiguas migradas).
- `appointments`: Completada (tablas antiguas migradas).
- `purchase_items`: Completada.
- `product_stylist_commissions`: Completada.
- `supplier_products`: Completada.
- `service_stylist_commissions`: Completada.

**Configuraciones regionales:**
- Campos de configuración regional en `tenants`: Completada.
- Campos de configuración regional en `tenant_sites`: Completada.
- Campos de configuración regional en `users`: Completada.
- Tabla `tenant_subscriptions`: En progreso (funcionalidad parcial cubierta por `subscription_status` en `tenants`).

**Índices y constraints:**
- Índices por `tenant_id` en todas las tablas de negocio: Completada.
- Foreign keys apropiadas: Completada.
- Constraints de unicidad necesarias: Completada.

### 1.2 Sistema de Autenticación y Autorización Custom

**Módulo de hash de contraseñas:**
- Implementar algoritmo de hash seguro (sin bcrypt): Completada.
- Generación de salt aleatorio: Completada.
- Función de verificación de contraseñas: Completada.

**Gestión de sesiones:**
- Sistema de tokens JWT o sesiones seguras: Pendiente.
- Middleware de autenticación: Pendiente.
- Manejo de expiración de sesiones: Pendiente.
- Logout seguro: Pendiente.

**Sistema de autorización:**
- Middleware de autorización basado en roles: Completada.
- Verificación de permisos granulares y por menú: Completada.
- Control de acceso por módulos/funcionalidades: Completada.

### 1.3 Configuración de Multi-Tenancy

**Contexto de tenant:**
- Identificación automática del tenant_id: Completada.
- Middleware para inyectar tenant_id en queries: Completada.
- Validación de aislamiento de datos: Completada.

**Filtros automáticos:**
- ORM/Query builder con filtro automático por tenant_id: Completada.
- Prevención de acceso cruzado entre tenants: Completada.
- Auditoría de acceso a datos: Pendiente.

### 1.4 Framework de Internacionalización (i18n)

**Configuración base:**
- Integración de react-i18next: Pendiente.
- Estructura de archivos de traducción: Pendiente.
- Carga dinámica de idiomas: Pendiente.
- Tabla `translations` o `i18n_keys` para textos del sistema: Completada.

**Localización:**
- Formateo de fechas por región: Pendiente.
- Formateo de monedas: Pendiente.
- Formateo de números: Pendiente.
- Manejo de zonas horarias: Completada.

---

**Notas:**
- Las tablas `permissions`, `user_permissions`, `menu_permissions`, `subscription_plans`, `countries`, `currencies` y `audit_logs` aún no han sido creadas.
- Las tablas antiguas de citas (`appointment_...`) han sido migradas a la nueva estructura de `attentions` y `service_sessions`.
