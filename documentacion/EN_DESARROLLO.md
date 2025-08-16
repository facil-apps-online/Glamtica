# Plan de Desarrollo: Corrección y Mejora del Módulo de Atenciones

Este documento describe el plan de trabajo para solucionar bugs, mejorar la performance y la experiencia de usuario en el módulo de atenciones.

---

### **Fase 1: Análisis y Corrección de Bugs**

*   **Estado:** `[✓] Completado`
*   **Objetivo:** Identificar y solucionar los bugs reportados en el módulo de atenciones, enfocándose en la lógica de negocio y la interacción con la base de datos.
*   **Tareas:**
    *   `[✓]` **1.1:** Analizar el hook `useAttentions.ts` y corregir la lógica de filtrado por usuario.
    *   `[✓]` **1.2:** Analizar el hook `useAttentionServices.ts` y asegurar que todas las queries relevantes se invaliden correctamente tras una mutación.
    *   `[✓]` **1.3:** Revisar el componente `AttentionDialog.tsx` para identificar y corregir bugs de estado y de flujo de usuario.

---

### **Fase 2: Mejora de la Experiencia de Usuario (UX)**

*   **Estado:** `[✓] Completado`
*   **Objetivo:** Mejorar la usabilidad y la robustez del formulario de creación de atenciones.
*   **Tareas:**
    *   `[✓]` **2.1:** Implementar un ID único para cada servicio en el formulario de atenciones para mejorar la estabilidad de la renderización en React.
    *   `[✓]` **2.2:** Añadir un indicador de carga en el selector de usuarios para dar feedback visual mientras se obtienen los datos.
    *   `[✓]` **2.3:** Asegurar que el usuario seleccionado se resetee al cambiar el servicio para prevenir asignaciones incorrectas.

---

### **Fase 3: Análisis de Performance e Identificación de Deuda Técnica**

*   **Estado:** `[✓] Completado`
*   **Objetivo:** Investigar la causa de la lentitud en la carga de usuarios disponibles y documentar la solución recomendada.
*   **Tareas:**
    *   `[✓]` **3.1:** Analizar el hook `useAvailableUsers.ts` y su interacción con la base de datos.
    *   `[✓]` **3.2:** Identificar el cuello de botella de performance (N+1 queries) en la verificación de disponibilidad de usuarios.
    *   `[✓]` **3.3:** Documentar el problema y la solución recomendada (refactorización a una única función de base de datos) en el archivo `SOLUTION_LOG.md`.

---

### **Fase 4: Refactorización a Edge Functions**

*   **Estado:** `[✓] Completado`
*   **Objetivo:** Centralizar todas las llamadas a la base de datos del módulo de atenciones a través de la Edge Function `tenant-actions` para mejorar la seguridad y mantenibilidad.
*   **Tareas:**
    *   `[✓]` **4.1:** Añadir los casos `get_attentions`, `get_attention_dates`, `create_full_attention`, y `cancel_attention` a la Edge Function `tenant-actions`.
    *   `[✓]` **4.2:** Refactorizar el hook `useAttentions.ts` para utilizar `callTenantAction`.
    *   `[✓]` **4.3:** Añadir el caso `add_attention_service` a la Edge Function `tenant-actions`.
    *   `[✓]` **4.4:** Refactorizar el hook `useAttentionServices.ts` para utilizar `callTenantAction`.
    *   `[✓]` **4.5:** Añadir el caso `get_available_users` a la Edge Function `tenant-actions`.
    *   `[✓]` **4.6:** Refactorizar el hook `useAvailableUsers.ts` para utilizar `callTenantAction`.
