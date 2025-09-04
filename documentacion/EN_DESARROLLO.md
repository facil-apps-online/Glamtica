# Fase de Desarrollo: Galería de Imágenes de Productos

## Objetivo
Mejorar la gestión de productos permitiendo a los usuarios asociar múltiples imágenes a cada producto, designar una imagen principal y, en fases posteriores, editar estas imágenes para eliminar el fondo.

---

### **Fase 1: Base de Datos y Backend (CRUD Básico)**

**1. Creación de la Tabla `product_images`**
- **Objetivo:** Crear la estructura de la base de datos para almacenar las imágenes de los productos.
- **Acciones:**
    - Crear un nuevo archivo de migración SQL.
    - Definir la tabla `product_images` con las siguientes columnas:
        - `id`: `UUID`, Primary Key, default `uuid_generate_v4()`.
        - `product_id`: `UUID`, Foreign Key a `products.id`, `ON DELETE CASCADE`.
        - `tenant_id`: `UUID`, Foreign Key a `tenants.id`, `ON DELETE CASCADE`.
        - `image_url`: `TEXT`, `NOT NULL`. Almacenará la URL de la imagen (inicialmente de Google Drive).
        - `is_primary`: `BOOLEAN`, `DEFAULT FALSE`. Indica si es la imagen principal del producto.
        - `sort_order`: `INTEGER`, `DEFAULT 0`. Para la ordenación manual de la galería.
        - `created_at`: `TIMESTAMPTZ`, `DEFAULT NOW()`.
        - `updated_at`: `TIMESTAMPTZ`, `DEFAULT NOW()`.

**2. Implementación de Endpoints en Edge Function (`tenant-actions`)**
- **Objetivo:** Crear la lógica de backend para gestionar las imágenes de los productos.
- **Acciones:**
    - Añadir los siguientes `case` al `switch` en `supabase/functions/tenant-actions/index.ts`:
        - **`get_product_images`**:
            - **Payload:** `{ productId: string }`
            - **Lógica:** Devuelve todas las imágenes de un producto, ordenadas por `sort_order`.
        - **`add_product_image`**:
            - **Payload:** `{ productId: string, imageUrl: string }`
            - **Lógica:** Añade una nueva imagen a un producto.
        - **`delete_product_image`**:
            - **Payload:** `{ imageId: string }`
            - **Lógica:** Elimina una imagen por su ID.
        - **`set_primary_product_image`**:
            - **Payload:** `{ productId: string, imageId: string }`
            - **Lógica:** Establece una imagen como principal. Debe asegurar que cualquier otra imagen para ese producto se marque como no principal (transacción).

---

### **Fase 2: Interfaz de Usuario (Gestión Básica)**

**1. Modificación del Diálogo de Productos (`MasterProductDialog.tsx`)**
- **Objetivo:** Integrar la gestión de imágenes en la interfaz de usuario.
- **Acciones:**
    - Añadir una nueva pestaña "Imágenes" al diálogo.
    - Crear un componente `ProductImageGallery.tsx` que se renderizará en esta pestaña.

**2. Componente `ProductImageGallery.tsx`**
- **Objetivo:** Permitir al usuario ver y gestionar las imágenes.
- **Funcionalidades:**
    - **Visualización:** Muestra una cuadrícula con las imágenes del producto. La imagen principal se destacará visualmente.
    - **Añadir Imagen:** Un campo de texto para pegar la URL de Google Drive y un botón "Añadir".
    - **Acciones por Imagen:** Cada imagen tendrá botones para "Eliminar" y "Marcar como Principal".

---

### **Fase 3: Funcionalidad Avanzada (Editor de Imágenes)**

**1. Investigación de Herramientas**
- **Objetivo:** Seleccionar una biblioteca o servicio de React para la edición de imágenes, específicamente para la eliminación de fondos.
- **Criterios:** Capa gratuita generosa, facilidad de integración, rendimiento.

**2. Integración del Editor**
- **Objetivo:** Permitir a los usuarios editar las imágenes antes de guardarlas.
- **Flujo de Usuario:**
    1.  Usuario pega la URL de la imagen.
    2.  La imagen se carga en un modal que contiene el editor.
    3.  El usuario utiliza la herramienta para quitar el fondo.
    4.  Al guardar, la imagen procesada se sube (posiblemente a un bucket de Supabase temporalmente) y la nueva URL se guarda en `product_images`.

---

### **Fase 4: (Opcional) Integración con Google Drive API**

**1. Autenticación y Subida**
- **Objetivo:** Reemplazar el pegado manual de URLs con una subida de archivos directa.
- **Acciones:**
    - Implementar el flujo de autenticación OAuth 2.0 para que los usuarios conecten su cuenta de Google.
    - Utilizar la API de Google Drive para subir los archivos directamente desde la aplicación.
    - Gestionar los permisos de los archivos para que sean públicamente visibles.