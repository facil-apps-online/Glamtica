
# Historias de Usuario – Glamtica.app

Sistema ERP SaaS multitenant para salones de belleza y barberías, con registro autónomo de empresas, suscripciones mensuales, módulos de gestión y dashboard inteligente.

---

## 🧩 1. Gestión de Tenants

### HU001 – Registro autónomo de tenant
**Como** propietario de un nuevo salón o barbería  
**Quiero** poder registrarme directamente desde la página sin intervención de soporte  
**Para** comenzar a usar el sistema en minutos

**Criterios de aceptación:**
- Formulario de registro con datos del negocio
- Se crea automáticamente el tenant, sede principal y usuario administrador
- Plan de prueba gratuito por 15 días

---

### HU002 – Gestión de suscripción mensual
**Como** sistema  
**Quiero** registrar y verificar el pago mensual de cada tenant  
**Para** asegurar el uso continuo del servicio

**Criterios de aceptación:**
- Cada tenant debe pagar su plan mensual
- Tiempo de gracia de hasta 3 días
- Acceso suspendido si no se paga después del tiempo de gracia

---

### HU003 – Configuración de planes
**Como** superadministrador  
**Quiero** crear, editar y eliminar planes de suscripción  
**Para** ofrecer distintas opciones de precio y características

**Criterios de aceptación:**
- Planes con nombre, precio, duración de prueba, funcionalidades
- Cada tenant debe estar vinculado a un plan

---

## 🏢 2. Multitenencia y multi-sede

### HU004 – Aislamiento de datos por tenant
**Como** administrador de un salón  
**Quiero** que mi empresa solo vea sus propios datos  
**Para** proteger la privacidad de mi negocio

---

### HU005 – Registro de múltiples sedes
**Como** administrador de un tenant  
**Quiero** crear varias sedes de mi negocio  
**Para** gestionar cada ubicación por separado

---

## 👥 3. Autenticación y usuarios

### HU006 – Registro y login con credenciales personalizadas
**Como** usuario de un salón  
**Quiero** iniciar sesión con correo y contraseña desde tablas del sistema  
**Para** no depender de Supabase Auth

---

### HU007 – Gestión de roles y permisos
**Como** administrador de sede  
**Quiero** asignar roles a los usuarios de mi sede  
**Para** definir lo que cada uno puede ver o hacer

---

## 💈 4. ERP para salones y barberías

### HU008 – Agenda de servicios
**Como** administrador o estilista  
**Quiero** tener un calendario de citas por día, profesional y sede  
**Para** gestionar mejor el tiempo y evitar traslapes

---

### HU009 – Control de caja diaria
**Como** administrador de sede  
**Quiero** abrir y cerrar caja cada día  
**Para** llevar control de ingresos por servicios y productos vendidos

---

### HU010 – Gestión de inventario
**Como** responsable de productos  
**Quiero** llevar entradas, salidas y stock mínimo por sede  
**Para** saber qué reponer y cuándo

---

### HU011 – Registro de servicios y productos
**Como** administrador  
**Quiero** definir servicios, duración, precio, y productos asociados  
**Para** ofrecerlos desde la agenda

---

### HU012 – Liquidación de estilistas/barberos
**Como** administrador  
**Quiero** generar reportes de pagos por servicios realizados  
**Para** pagar comisiones correctamente

---

## 📊 5. Dashboard e indicadores

### HU013 – Ver dashboard de mi negocio
**Como** administrador  
**Quiero** ver estadísticas de citas, ingresos, estilistas más activos y productos más vendidos  
**Para** tomar decisiones rápidas

---

## 🔒 Técnicos y plataforma

### HU014 – Uso de Supabase solo como base de datos
**Como** equipo de desarrollo  
**Quiero** evitar Supabase Auth y manejar mis propias tablas  
**Para** tener control total de la seguridad y roles

---

### HU015 – Registro automático de fechas de prueba y vencimiento
**Como** sistema  
**Quiero** asignar automáticamente la fecha de inicio y expiración del plan de prueba  
**Para** saber cuándo suspender el acceso o solicitar pago

---
