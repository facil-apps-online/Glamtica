# Guía de Arquitectura y Convenciones - Glamtica.app

Este documento es la fuente de verdad para las decisiones de arquitectura, patrones de código y convenciones utilizadas en el proyecto. El objetivo es mantener la coherencia, la calidad y facilitar la incorporación de nuevos desarrolladores.

## 1. Arquitectura del Backend

### 1.1. Modelo de Datos y Autenticación

El proyecto utiliza un sistema de autenticación y gestión de roles **100% personalizado**, separado del sistema `auth` de Supabase.

- **Tablas Principales:**
  - `public.users`: Contiene la información principal del usuario, incluyendo `id`, `email`, `password_hash`, `first_name`, `last_name`, `is_active`, `tenant_id` y `branch_id`. **Esta es la fuente de verdad para la lógica de negocio.**
  - `public.roles`: Define los roles disponibles en la aplicación (`super_admin`, `tenant_super_admin`, etc.).
  - `public.tenants` y `public.branches`: Definen la estructura organizativa.

- **Flujo de Autenticación:**
  1.  El frontend llama a la RPC `public.login_user` con email y contraseña.
  2.  Esta función verifica las credenciales contra `public.users`.
  3.  Si son válidas, devuelve los datos del usuario (incluyendo `first_name`, `last_name` y `role_name`).
  4.  El frontend recibe estos datos y los envía a la Edge Function `generate-jwt`.
  5.  La Edge Function crea un token JWT **personalizado** con los datos recibidos y lo devuelve.
  6.  El frontend guarda este token en `localStorage` para las siguientes peticiones.

- **Punto Clave:** Debido a este flujo personalizado, las funciones de ayuda de Supabase como `auth.uid()` o `auth.jwt()` **no funcionan como se espera** dentro de las funciones RPC, ya que el token no es un token de sesión de Supabase Auth.

### 1.2. Funciones de Base de Datos (RPCs)

- **Seguridad:** Toda función RPC que deba ser accedida por un rol específico (ej. `super_admin`) **debe** aceptar un parámetro `p_user_role TEXT`. La primera línea de la función debe ser una guarda de seguridad que valide este parámetro.
  ```sql
  IF p_user_role != 'super_admin' THEN
      RAISE EXCEPTION 'Acceso denegado. Se requiere rol de super_admin.';
  END IF;
  ```
- **Permisos:** Las funciones que modifican datos (`UPDATE`, `INSERT`, `DELETE`) en tablas protegidas deben declararse con `SECURITY DEFINER` para que se ejecuten con los privilegios del creador de la función.

## 2. Arquitectura del Frontend

### 2.1. Gestión de Estado

- **Estado del Servidor (React Query):** Se utiliza `@tanstack/react-query` para todas las operaciones de datos con el backend (CRUD).
  - **Queries (`useQuery`):** Se encapsulan en hooks personalizados (ej. `useTenantUsers`).
  - **Mutations (`useMutation`):** Se usan para crear, actualizar o eliminar datos. En el `onSuccess`, se debe invalidar la query correspondiente para refrescar la UI.
    ```tsx
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantUsers', tenantId] });
    }
    ```
- **Estado de Autenticación (`AuthContext`):** Se gestiona en `src/contexts/AuthContext.tsx`. Este contexto es responsable de almacenar los datos del usuario decodificados del token JWT y de proveer las funciones de `login` y `logout`.

### 2.2. Patrones de UI y Componentes

#### Diseño Responsivo (Mobile-First)

Para las páginas que muestran listados de datos, se debe seguir el patrón de "Tarjetas en móvil, Tabla en escritorio".

1.  **Contenedor Principal:** La página debe tener un `div` contenedor principal con las clases `w-full py-4 md:p-6`. Esto asegura un espaciado consistente en toda la aplicación.
2.  **Lógica de Renderizado:** Se usa el hook `useScreenSize` para cambiar entre la vista de tarjetas y la de tabla.

**Ejemplo (`TenantsList.tsx`):**
```tsx
const screenSize = useScreenSize();
// ...
return (
  <div className="w-full py-4 md:p-6">
    {/* ... */}
    {screenSize === 'mobile' ? (
      <div className="space-y-4">{/* Mapear datos en <Card> */}</div>
    ) : (
      <div className="border rounded-lg"><Table>{/* ... */}</Table></div>
    )}
  </div>
)
```

#### Pestañas (Tabs) Responsivas

Cuando un componente `Tabs` tiene muchas pestañas que no caben en una pantalla móvil, se debe usar el siguiente patrón para permitir el desplazamiento horizontal:
```tsx
<TabsList className="w-full flex-nowrap overflow-x-auto justify-start">
  {/* ... TabsTriggers ... */}
</TabsList>
```

#### API del Navegador (Clipboard)

La API `navigator.clipboard` solo funciona en contextos seguros (HTTPS o localhost). Para asegurar que la funcionalidad de "copiar al portapapeles" funcione también en entornos de desarrollo accedidos por IP, se debe usar un fallback.

**Ejemplo de implementación:**
```tsx
const copyToClipboard = () => {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(textToCopy);
  } else {
    // Fallback para contextos no seguros
    const textArea = document.createElement("textarea");
    textArea.value = textToCopy;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
};
```

---
*Este documento es una guía viva y debe ser actualizada a medida que el proyecto evoluciona.*