# Tarea: Sistema de Emails Transaccionales (Backend y Documentación Completos)

**Objetivo:** Crear un sistema asíncrono y robusto para el envío de correos transaccionales, gestionado por el superadmin y configurable por los tenants.

---

### Fase 1: Arquitectura de Backend - [COMPLETADA]

- [x] **Diseñar y crear la tabla `email_templates`**: Almacena las plantillas maestras.
- [x] **Diseñar y crear la tabla `tenant_template_settings`**: Permite a cada tenant activar/desactivar envíos.
- [x] **Diseñar y crear la tabla `email_queue`**: Actúa como cola de trabajos para el envío asíncrono.
- [x] **Implementar la Edge Function `process-email-queue`**: Orquesta todo el proceso de envío.
- [x] **Implementar RPCs de soporte**: `encrypt_secret`, `decrypt_secret` y `enqueue_test_email`.
- [x] **Validación de Extremo a Extremo**: Se ha enviado exitosamente un correo de prueba.
- [x] **Documentación**: Se ha actualizado `WORK_DOCUMENTS.md` y `SUPERADMIN.md` con la nueva arquitectura.

---

### Fase 2: Interfaz de Usuario (Frontend - Pendiente)

- [ ] **Panel de Superadmin**: Crear una interfaz para que el superadmin pueda crear, editar y gestionar las `email_templates` maestras.
- [ ] **Panel de Tenant**: Crear la interfaz en la configuración del tenant para que pueda ver la lista de comunicaciones disponibles y usar los interruptores (`is_active`) en `tenant_template_settings`.
- [ ] **Limpieza de Código de Prueba**: Eliminar la RPC `enqueue_test_email` y el botón de prueba del frontend.
