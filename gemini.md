Siempre debes responder en español. Debes ser muy creativo y buscar y analizar antes de hacer cambios.

**Configuración del Entorno:**
- **Sistema Operativo:** Windows. Utilizaré comandos de Windows (`dir`, `del`, `copy`, etc.) en lugar de comandos de Linux/Unix (`ls`, `rm`, `cp`, etc.).

**Directrices de Desarrollo:**
- **Diseño Responsive (Mobile-First):** Todos los formularios, tablas y componentes CRUD deben ser completamente responsives. Se debe utilizar el hook `useIsMobile` para renderizar una vista optimizada para dispositivos móviles (generalmente usando tarjetas o listas verticales) y una vista de tabla o grid para escritorio. La experiencia en móvil es prioritaria.
- **Creación de Campos:** Al diseñar o modificar esquemas de base de datos o estructuras de datos, seré generoso con los campos. Incluiré detalles adicionales que puedan ser útiles en el futuro, más allá de lo estrictamente básico, para asegurar la flexibilidad y escalabilidad del sistema.

**Consideraciones sobre Herramientas:**
- **Comando `replace`:** Debido a limitaciones con la unicidad de las cadenas a reemplazar, si el comando `replace` falla, se utilizará una estrategia alternativa: leer el contenido completo del archivo, modificarlo en memoria y luego reescribir el archivo con el contenido actualizado.

**Directrices de Interacción:**
- **Aprobación del Plan Completo**: Siempre debo presentar el plan completo de acción para tu aprobación antes de comenzar cualquier ejecución. No solicitaré aprobación paso a paso.

**Proceso de Trabajo y Documentación:**

Existen 3 archivos clave para nuestro flujo de trabajo:

1.  **`WORK_PLAN.md`**:
    *   **Contenido**: El plan de trabajo detallado que estamos siguiendo.
    *   **Actualización**: Debo actualizar este archivo para marcar el inicio del desarrollo de un punto específico. Marcaré el punto como finalizado solo después de preguntarte y recibir tu confirmación.

2.  **`WORK_DOCUMENTS.md`**:
    *   **Contenido**: Documentación técnica de las funcionalidades implementadas.
    *   **Actualización**: Una vez que una implementación ha sido aprobada, debo redactar y añadir la documentación correspondiente en este archivo.

3.  **`SOLUTION_LOG.md`**:
    *   **Contenido**: Una bitácora de errores encontrados y las soluciones aplicadas.
    *   **Mi Proceso**: Antes de proponer cualquier solución a un problema, debo revisar este archivo para verificar si ya existe una solución documentada y así evitar repetir el trabajo. Este archivo no debe ser limpiado ni borrado; funciona como un registro histórico.

4.  **`EN_DESARROLLO.md`**:
    *   **Contenido**: Define y actualiza el desarrollo puntual en curso.
    *   **Flujo**: Se define un desarrollo, se agrega aquí con sus fases. A medida que se ejecuta, se documenta el progreso. Una vez terminado, su contenido puede servir para la documentación final en `WORK_DOCUMENTS.md` o `SUPERADMIN.md`, se limpia al empezar un desarrollo nuevo.

**Directrices Adicionales:**
- **Documentación en `SUPERADMIN.md`:** Siempre que se realice un cambio o se documente una funcionalidad relevante para el superadministrador, se debe actualizar también el archivo `SUPERADMIN.md` con la información pertinente.
- **Definición del Mensaje de Commit:** Cuando se solicite un commit, si el mensaje contiene caracteres especiales o saltos de línea, se debe crear un archivo temporal (ej. `commit_message.txt`) con el contenido del mensaje y luego usar `git commit -F commit_message.txt` para realizar el commit. Esto evita problemas de interpretación del shell.