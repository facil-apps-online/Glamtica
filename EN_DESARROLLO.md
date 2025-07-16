# Tarea: Refactorización y Separación de Integraciones de Google (En Curso)

**Objetivo:** Reestructurar el módulo para gestionar las integraciones de Google (Drive y Gmail) de forma separada y robusta, permitiendo la conexión y desconexión individual de cada servicio.

**Fase 1: Reestructuración de la Interfaz de Usuario**
- [x] **Modificar `TenantIntegrationManager.tsx`**: Mostrar dos secciones/tarjetas distintas, una para "Google Drive" y otra para "Gmail". Cada una con su propio estado y botones.

**Fase 2: Lógica de Autorización Separada**
- [x] **RPC para Gmail**: Crear una nueva función `get_gmail_auth_url` que solicite únicamente los scopes de Gmail.
- [x] **RPC para Drive**: Mantener la función `get_google_auth_url` existente solo para los scopes de Drive.
- [x] **Callback Inteligente**: Actualizar la página de callback de OAuth para manejar ambas autorizaciones y guardar el `provider` correcto (`google_drive` o `google_gmail`).

**Fase 3: Implementación de Desconexión (Pendiente)**
- [x] **Revisar RPC `delete_tenant_integration`**: Asegurarse de que la función de borrado funcione correctamente para un proveedor específico.
- [x] **Crear Edge Function `revoke-google-token`**: Implementar la lógica para invalidar el token en los servidores de Google.
- [x] **Conectar UI**: Implementar la lógica completa en los botones "Desconectar" de cada servicio.

---
# Tarea: Integración con Gmail para Envío de Comunicaciones (Depende de Refactorización)

**Fase 1: Autorización**
- [x] **Completar la Fase 2 de la Refactorización**: La autorización de Gmail ahora se maneja como parte de la tarea de refactorización de integraciones.

**Fase 2: Envío de Correos**
- [ ] **Crear Función RPC `send_email_via_gmail`**: Desarrollar la función que obtenga los tokens y llame a la API de Gmail.
- [ ] **Implementar Lógica de Refresco de Token**.

**Fase 3: Interfaz de Usuario**
- [ ] **Crear Componente de Envío**: Diseñar un formulario en el frontend para redactar y enviar correos.
